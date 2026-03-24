/**
 * Webhook trigger lifecycle for https://webhook.photon.codes
 *
 * Bridge API contract:
 *   POST   /api/webhooks       { serverUrl, apiKey, webhookUrl } → { id, signingSecret }
 *   GET    /api/webhooks?serverUrl=...&apiKey=... → [{ id, webhookUrl, ... }]
 *   DELETE /api/webhooks/:id   → 204
 *
 * Incoming webhooks: Bridge POSTs to Zapier with body { event, data }.
 */
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { WEBHOOK_BRIDGE_URL, normalizeUrl } from "../authentication.js";

/**
 * Removes all existing webhooks for a given server from the bridge.
 * Called before creating a new one to prevent stale subscriptions.
 */
async function cleanupExistingWebhooks(
  z: ZObject,
  serverUrl: string,
  apiKey: string,
): Promise<void> {
  const listResp = await z.request({
    url: `${WEBHOOK_BRIDGE_URL}/api/webhooks`,
    method: "GET",
    params: { serverUrl, apiKey },
    skipThrowForStatus: true,
  });

  if (listResp.status !== 200) return;

  const webhooks = listResp.data as Array<{ id: string }>;
  if (!Array.isArray(webhooks)) return;

  for (const wh of webhooks) {
    await z.request({
      url: `${WEBHOOK_BRIDGE_URL}/api/webhooks/${wh.id}`,
      method: "DELETE",
      skipThrowForStatus: true,
    });
  }
}

/**
 * Registers a webhook with the Photon Webhook Bridge.
 * First removes any stale webhooks for this server to ensure exactly one
 * subscription exists.
 */
export const subscribe = (async (z: ZObject, bundle: Bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const apiKey = (bundle.authData.apiKey as string)?.trim();

  await cleanupExistingWebhooks(z, serverUrl, apiKey);

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
    const msg =
      (body?.error as string) || `Bridge returned HTTP ${response.status}`;
    throw new z.errors.Error(msg, "BridgeError", response.status);
  }

  const data = response.data as { id: string };
  return { id: data.id };
}) satisfies WebhookTriggerPerformSubscribe;

/**
 * Removes the webhook registration from the Photon Webhook Bridge.
 * Also cleans up any other webhooks for this server as a safety net.
 */
export const unsubscribe = (async (z: ZObject, bundle: Bundle) => {
  const webhookId = (bundle.subscribeData as Record<string, unknown>)?.id;
  if (webhookId) {
    await z.request({
      url: `${WEBHOOK_BRIDGE_URL}/api/webhooks/${webhookId}`,
      method: "DELETE",
      skipThrowForStatus: true,
    });
  }

  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const apiKey = (bundle.authData.apiKey as string)?.trim();
  await cleanupExistingWebhooks(z, serverUrl, apiKey);

  return {};
}) satisfies WebhookTriggerPerformUnsubscribe;

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
  return async (z: ZObject, bundle: Bundle): Promise<T[]> => {
    const payload = bundle.cleanedRequest as {
      event?: string;
      data?: Record<string, unknown>;
    };

    if (!payload?.data || payload.event !== eventName) {
      throw new z.errors.HaltedError(
        `Ignoring event "${payload?.event ?? "none"}" (expected "${eventName}")`,
      );
    }

    if (filter && !filter(payload.data)) {
      throw new z.errors.HaltedError("Event filtered out");
    }

    return [transform(payload.data)];
  };
}
