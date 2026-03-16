/**
 * Webhook trigger lifecycle for https://webhook.photon.codes
 *
 * Bridge API contract:
 *   POST   /api/webhooks       { serverUrl, apiKey, webhookUrl } → { id, signingSecret }
 *   DELETE /api/webhooks/:id   → 204
 *
 * Incoming webhooks: Bridge POSTs to Zapier with body { event, data }.
 */
// import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { WEBHOOK_BRIDGE_URL, normalizeUrl } from "../authentication.js";

// const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

// ---------- signature verification (disabled) ----------
// export function verifySignature(
//   rawBody: string,
//   signingSecret: string | undefined,
//   signature: string | undefined,
//   timestamp: string | undefined,
// ): boolean {
//   if (!signingSecret) return false;
//   if (!signature || !timestamp) return false;
//   const ts = Number(timestamp);
//   if (Number.isNaN(ts)) return false;
//   const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
//   if (age > MAX_TIMESTAMP_DRIFT_SECONDS) return false;
//   const sigBase = `v0:${timestamp}:${rawBody}`;
//   const expected = `v0=${createHmac("sha256", signingSecret).update(sigBase).digest("hex")}`;
//   try {
//     return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
//   } catch {
//     return false;
//   }
// }

/**
 * Registers a webhook with the Photon Webhook Bridge.
 * Returns { id } stored in subscribeData.
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

  const data = response.data as { id: string };
  return { id: data.id };
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

// ---------- signature helpers (disabled) ----------
// export function getSigningSecret(bundle: Bundle): string { ... }
// export function assertValidSignature(z: ZObject, bundle: Bundle): void { ... }

/**
 * Creates a webhook perform function that filters for a specific event
 * and maps the payload using the provided transform function.
 * An optional predicate can drop events before they reach the Zap actions.
 */
export function makePerform<T extends Record<string, unknown>>(
  eventName: string,
  transform: (data: Record<string, unknown>) => T,
  filter?: (data: Record<string, unknown>) => boolean,
) {
  return async (_z: ZObject, bundle: Bundle): Promise<T[]> => {
    const payload = bundle.cleanedRequest as {
      event?: string;
      data?: Record<string, unknown>;
    };

    if (!payload?.data || payload.event !== eventName) {
      return [];
    }

    if (filter && !filter(payload.data)) {
      return [];
    }

    return [transform(payload.data)];
  };
}
