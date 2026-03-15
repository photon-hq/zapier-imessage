/**
 * Webhook trigger lifecycle for https://webhook.photon.codes
 *
 * Bridge API contract:
 *   POST   /api/webhooks       { serverUrl, apiKey, webhookUrl } → { id, signingSecret }
 *   DELETE /api/webhooks/:id   → 204
 *
 * Incoming webhooks: Bridge POSTs to Zapier with body { event, data },
 * headers X-Photon-Signature (v0=<hmac-hex>), X-Photon-Timestamp (unix sec).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { WEBHOOK_BRIDGE_URL, normalizeUrl } from "../authentication.js";

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

/**
 * Registers a webhook with the Photon Webhook Bridge.
 * Returns { id, signingSecret } stored in subscribeData.
 */
export const subscribe = (async (z: ZObject, bundle: Bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const apiKey = (bundle.authData.apiKey as string)?.trim();

  const response = await z.request({
    url: `${WEBHOOK_BRIDGE_URL}/api/webhooks`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serverUrl,
      apiKey,
      webhookUrl: bundle.targetUrl,
    }),
    skipThrowForStatus: true,
  });

  if (response.status === 401) {
    throw new z.errors.Error(
      "The Webhook Bridge could not connect to your Photon server. Check your Endpoint and API Key.",
      "AuthenticationError",
      401,
    );
  }

  if (response.status >= 400) {
    const body = response.data as Record<string, unknown> | undefined;
    const msg = (body?.error as string) || `Bridge returned HTTP ${response.status}`;
    throw new z.errors.Error(msg, "BridgeError", response.status);
  }

  const data = response.data as { id: string; signingSecret: string };
  return { id: data.id, signingSecret: data.signingSecret };
}) satisfies WebhookTriggerPerformSubscribe;

/**
 * Removes the webhook registration from the Photon Webhook Bridge.
 */
export const unsubscribe = (async (z: ZObject, bundle: Bundle) => {
  const webhookId = (bundle.subscribeData as Record<string, unknown>)?.id;
  if (!webhookId) return {};

  await z.request({
    url: `${WEBHOOK_BRIDGE_URL}/api/webhooks/${webhookId}`,
    method: "DELETE",
    skipThrowForStatus: true,
  });

  return {};
}) satisfies WebhookTriggerPerformUnsubscribe;

/**
 * Returns the signing secret from subscribeData (set during performSubscribe).
 */
export function getSigningSecret(bundle: Bundle): string {
  const sub = (bundle.subscribeData ?? {}) as Record<string, unknown>;
  const secret = (sub.signingSecret as string)?.trim();
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
      "Signing secret not found. Try turning the Zap off and on again to re-register the webhook.",
      "MissingSigningSecret",
      403,
    );
  }
  const sig =
    headers["x-photon-signature"] ?? headers["X-Photon-Signature"];
  const ts = headers["x-photon-timestamp"] ?? headers["X-Photon-Timestamp"];
  if (!verifySignature(rawBody, signingSecret, sig, ts)) {
    throw new z.errors.Error(
      "Invalid or missing webhook signature. Try turning the Zap off and on again to get a fresh signing secret.",
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
