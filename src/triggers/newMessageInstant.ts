import {
  defineTrigger,
  type WebhookTriggerPerform,
  type WebhookTriggerPerformList,
  type WebhookTriggerPerformSubscribe,
  type WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

const WEBHOOK_BRIDGE_EVENT = "new-message";

const performSubscribe = (async (z, bundle) => {
  const bridgeUrl = normalizeUrl(bundle.authData.webhookBridgeUrl as string);
  if (!bridgeUrl) {
    throw new z.errors.Error(
      "Webhook Bridge URL is required for instant triggers. " +
        "Please update your Photon iMessage connection and provide the Webhook Bridge URL.",
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

const performUnsubscribe = (async (z, bundle) => {
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
 * Processes the inbound webhook payload from the Photon Webhook Bridge.
 * Payload shape: { event: string, data: { ... } }
 */
const perform = (async (_z, bundle) => {
  const payload = bundle.cleanedRequest as {
    event?: string;
    data?: Record<string, unknown>;
  };

  if (!payload?.data) {
    return [];
  }

  if (payload.event !== WEBHOOK_BRIDGE_EVENT) {
    return [];
  }

  const msg = payload.data;
  return [
    {
      id: (msg.guid as string) || `hook-${Date.now()}`,
      guid: msg.guid,
      text: msg.text,
      sender:
        (msg.handle as Record<string, unknown>)?.address ?? msg.senderAddress,
      chatGuid:
        Array.isArray(msg.chats) && msg.chats.length > 0
          ? msg.chats[0]
          : msg.chatGuid,
      dateCreated: msg.dateCreated,
      isFromMe: msg.isFromMe ?? false,
      hasAttachments: Array.isArray(msg.attachments)
        ? msg.attachments.length > 0
        : false,
    },
  ];
}) satisfies WebhookTriggerPerform;

/**
 * Fallback polling used during Zap setup so the user can load test data
 * without waiting for a live webhook event.
 */
const performList = (async (z, bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const response = await z.request<{
    data?: Array<{
      guid: string;
      text: string;
      handle?: { address: string };
      chats?: string[];
      dateCreated: number;
      isFromMe: boolean;
      attachments?: unknown[];
    }>;
  }>({
    url: `${serverUrl}/api/v1/message/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { sort: "DESC", limit: 10 },
  });

  const messages = response.data?.data ?? [];
  return messages
    .filter((msg) => !msg.isFromMe)
    .map((msg) => ({
      id: msg.guid,
      guid: msg.guid,
      text: msg.text,
      sender: msg.handle?.address,
      chatGuid: msg.chats?.[0],
      dateCreated: msg.dateCreated,
      isFromMe: msg.isFromMe,
      hasAttachments: (msg.attachments?.length ?? 0) > 0,
    }));
}) satisfies WebhookTriggerPerformList;

export default defineTrigger({
  key: "new_message_instant",
  noun: "Message",

  display: {
    label: "New Message Received (Instant)",
    description:
      "Triggers when a new iMessage is received instantly via the Photon Webhook Bridge.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe,
    performUnsubscribe,

    sample: {
      id: "p:0/fake-guid-1234",
      guid: "p:0/fake-guid-1234",
      text: "Hello from iMessage!",
      sender: "+11234567890",
      chatGuid: "iMessage;-;+11234567890",
      dateCreated: 1700000000000,
      isFromMe: false,
      hasAttachments: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "GUID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "dateCreated", label: "Date Created", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
      { key: "hasAttachments", label: "Has Attachments", type: "boolean" },
    ],
  },
});
