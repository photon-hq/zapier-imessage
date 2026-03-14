/**
 * Webhook trigger lifecycle for https://webhook.photon.codes
 *
 * 1) Subscribe (Zap ON): POST to bridge /api/webhooks with
 *    { serverUrl, apiKey, webhookUrl }. Bridge returns { id, signingSecret }.
 *    Both are stored in subscribeData automatically by Zapier.
 *
 * 2) Incoming webhooks: Bridge POSTs to Zapier with body { event, data },
 *    headers X-Photon-Signature (v0=<hmac-hex>), X-Photon-Timestamp (unix sec).
 *    We verify with verifySignature() using subscribeData.signingSecret.
 *
 * 3) Unsubscribe (Zap OFF): DELETE bridge /api/webhooks/:id.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { normalizeUrl, WEBHOOK_BRIDGE_URL } from "../authentication.js";

const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

/**
 * Verifies the HMAC-SHA256 signature on an incoming webhook payload.
 * Signature format: v0=<hex>
 * Signed base string: v0:<timestamp>:<rawBody>
 */
export function verifySignature(
  rawBody: string,
  signingSecret: string | undefined,
  signature: string | undefined,
  timestamp: string | undefined,
): boolean {
  if (!signingSecret) return false;
  if (!signature || !timestamp) return false;

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
  const bridgeUrl = normalizeUrl(WEBHOOK_BRIDGE_URL);
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
  if (!bundle.subscribeData?.id) {
    return {};
  }

  const bridgeUrl = normalizeUrl(WEBHOOK_BRIDGE_URL);
  await z.request({
    url: `${bridgeUrl}/api/webhooks/${bundle.subscribeData.id}`,
    method: "DELETE",
  });

  return {};
}) satisfies WebhookTriggerPerformUnsubscribe;

/**
 * Returns the signing secret from subscribeData (set during performSubscribe).
 * Throws if missing -- this means the Zap wasn't properly subscribed.
 */
export function getSigningSecret(bundle: Bundle): string {
  const sub = (bundle.subscribeData ?? {}) as Record<string, unknown>;
  const secret = sub.signingSecret as string | undefined;
  if (!secret) {
    throw new Error("MissingSigningSecret");
  }
  return secret;
}

/**
 * Verifies the webhook signature from the bundle; throws on failure.
 */
export function assertValidSignature(z: ZObject, bundle: Bundle): void {
  const headers = (bundle.rawRequest?.headers ?? {}) as Record<string, string>;
  const rawBody = bundle.rawRequest?.content ?? "";
  let signingSecret: string;
  try {
    signingSecret = getSigningSecret(bundle);
  } catch {
    throw new z.errors.Error(
      "Signing secret not found. This Zap may not be properly subscribed. Try turning the Zap off and on again.",
      "MissingSigningSecret",
      403,
    );
  }
  const sig =
    headers["x-photon-signature"] ?? headers["X-Photon-Signature"];
  const ts = headers["x-photon-timestamp"] ?? headers["X-Photon-Timestamp"];
  if (!verifySignature(rawBody, signingSecret, sig, ts)) {
    throw new z.errors.Error(
      "Invalid or missing webhook signature. Ensure the bridge sends X-Photon-Signature and X-Photon-Timestamp headers.",
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
