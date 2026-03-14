import {
  defineTrigger,
  type WebhookTriggerPerformList,
} from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const perform = makePerform("new-message", (msg) => ({
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
}));

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
    label: "New Message Received",
    description:
      "Triggers when a new iMessage is received. Webhook configuration and signing are handled automatically via https://webhook.photon.codes when the Zap turns on.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "p:0/sample-new-msg-1",
      guid: "p:0/sample-new-msg-1",
      text: "Hello from iMessage!",
      sender: "+11234567890",
      chatGuid: "iMessage;-;+11234567890",
      dateCreated: 1700000000000,
      isFromMe: false,
      hasAttachments: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Message ID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "chatGuid", label: "Chat" },
      { key: "dateCreated", label: "Date", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
      { key: "hasAttachments", label: "Has Attachments", type: "boolean" },
    ],
  },
});
