import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

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
 * Creates a webhook perform function that filters for a specific event and
 * maps the payload using the provided transform function.
 */
export function makePerform<T extends Record<string, unknown>>(
  eventName: string,
  transform: (data: Record<string, unknown>) => T,
) {
  return async (_z: ZObject, bundle: Bundle): Promise<T[]> => {
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
