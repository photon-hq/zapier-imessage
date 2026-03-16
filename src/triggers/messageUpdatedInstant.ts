import {
  defineTrigger,
  type WebhookTriggerPerformList,
} from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";
import { normalizeUrl } from "../authentication.js";

const performList = (async (z: ZObject, bundle: Bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const response = await z.request<{
    data?: Array<{
      guid: string;
      text: string;
      handle?: { address: string };
      chats?: string[];
      dateCreated: number;
      isFromMe: boolean;
      dateModified?: number;
      previousText?: string;
    }>;
  }>({
    url: `${serverUrl}/api/v1/message/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { sort: "DESC", limit: 10 },
  });

  const messages = response.data?.data ?? [];
  return messages.map((msg) => ({
    id: msg.guid,
    guid: msg.guid,
    text: msg.text,
    previousText: msg.previousText,
    editedAt: msg.dateModified,
    sender: msg.handle?.address,
    dateCreated: msg.dateCreated,
    isFromMe: msg.isFromMe ?? false,
  }));
}) satisfies WebhookTriggerPerformList;

/**
 * Only fire for genuine edits — ignore delivery receipts, read receipts,
 * and other status-only updates that the server also sends as
 * "updated-message" events.
 */
function shouldTrigger(msg: Record<string, unknown>): boolean {
  if (msg.isFromMe) return false;

  if (msg.dateEdited || msg.dateModified) return true;
  if (
    typeof msg.previousText === "string" &&
    typeof msg.text === "string" &&
    msg.previousText !== msg.text
  ) {
    return true;
  }
  return false;
}

const perform = makePerform(
  "updated-message",
  (msg) => ({
    id: (msg.guid as string) || `hook-${Date.now()}`,
    guid: msg.guid,
    text: msg.text,
    previousText: msg.previousText ?? msg.originalText ?? undefined,
    editedAt: msg.editedAt ?? msg.dateModified ?? undefined,
    sender:
      (msg.handle as Record<string, unknown>)?.address ?? msg.senderAddress,
    dateCreated: msg.dateCreated,
    isFromMe: msg.isFromMe ?? false,
  }),
  shouldTrigger,
);

export default defineTrigger({
  key: "message_updated_instant",
  noun: "Message",

  display: {
    label: "Message Updated",
    description:
      "Triggers when an iMessage is edited or updated on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "p:0/sample-updated-msg-1",
      guid: "p:0/sample-updated-msg-1",
      text: "Edited message text",
      previousText: "Original message before edit",
      editedAt: 1710000000000,
      sender: "+11234567890",
      dateCreated: 1700000000000,
      isFromMe: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Message ID" },
      { key: "text", label: "Text (current after edit)" },
      { key: "previousText", label: "Previous Text (before edit)" },
      { key: "editedAt", label: "Edited At", type: "integer" },
      { key: "sender", label: "Sender" },
      { key: "dateCreated", label: "Date", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
    ],
  },
});
