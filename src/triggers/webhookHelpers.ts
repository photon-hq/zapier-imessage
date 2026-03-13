import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

/**
 * Verifies the HMAC-SHA256 signature on an incoming webhook payload from the
 * Photon Webhook Bridge.  Returns true when the signature is valid or when
 * no signing secret is available (graceful degradation for older subscriptions).
 */
export function verifySignature(
  rawBody: string,
  signingSecret: string | undefined,
  signature: string | undefined,
  timestamp: string | undefined,
): boolean {
  if (!signingSecret || !signature || !timestamp) return true;

  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > MAX_TIMESTAMP_DRIFT_SECONDS) return false;

  const sigBase = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac("sha256", signingSecret).update(sigBase).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export const subscribe = (async (z: ZObject, bundle: Bundle) => {
  const bridgeUrl = normalizeUrl(bundle.authData.webhookBridgeUrl as string);
  if (!bridgeUrl) {
    throw new z.errors.Error(
      "Webhook Bridge URL is required. Please update your Photon iMessage connection.",
      "ConfigurationError",
    );
  }

  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const response = await z.request({
    url: `${bridgeUrl}/api/webhooks`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      serverUrl,
      apiKey: bundle.authData.apiKey,
      webhookUrl: bundle.targetUrl,
    },
  });

  return response.data as { id: string; signingSecret: string };
}) satisfies WebhookTriggerPerformSubscribe;

export const unsubscribe = (async (z: ZObject, bundle: Bundle) => {
  const bridgeUrl = normalizeUrl(bundle.authData.webhookBridgeUrl as string);
  if (!bridgeUrl || !bundle.subscribeData?.id) {
    return {};
  }

  await z.request({
    url: `${bridgeUrl}/api/webhooks/${bundle.subscribeData.id}`,
    method: "DELETE",
  });

  return {};
}) satisfies WebhookTriggerPerformUnsubscribe;

/**
 * Verifies the webhook signature from a bundle, throwing on failure.
 * Use this in custom perform functions that don't go through `makePerform`.
 */
export function assertValidSignature(z: ZObject, bundle: Bundle): void {
  const headers = (bundle.rawRequest?.headers ?? {}) as Record<string, string>;
  const rawBody = bundle.rawRequest?.content ?? "";
  const subData = (bundle.subscribeData ?? {}) as Record<string, unknown>;
  const signingSecret = subData.signingSecret as string | undefined;

  if (
    !verifySignature(
      rawBody,
      signingSecret,
      headers["x-photon-signature"] ?? headers["X-Photon-Signature"],
      headers["x-photon-timestamp"] ?? headers["X-Photon-Timestamp"],
    )
  ) {
    throw new z.errors.Error(
      "Invalid webhook signature — request rejected.",
      "SignatureError",
      403,
    );
  }
}

/**
 * Creates a webhook perform function that verifies the HMAC-SHA256 signature,
 * filters for a specific event, and maps the payload using the provided
 * transform function.
 */
export function makePerform<T extends Record<string, unknown>>(
  eventName: string,
  transform: (data: Record<string, unknown>) => T,
) {
  return async (z: ZObject, bundle: Bundle): Promise<T[]> => {
    assertValidSignature(z, bundle);

    const payload = bundle.cleanedRequest as {
      event?: string;
      data?: Record<string, unknown>;
    };

    if (!payload?.data || payload.event !== eventName) {
      return [];
    }

    return [transform(payload.data)];
  };
}
