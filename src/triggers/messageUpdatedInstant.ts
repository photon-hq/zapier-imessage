import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "p:0/sample-updated-msg-1",
    guid: "p:0/sample-updated-msg-1",
    text: "Edited message text",
    previousText: "Original message before edit",
    editedAt: 1710000000000,
    sender: "+11234567890",
    chatGuid: "iMessage;-;+11234567890",
    dateCreated: 1700000000000,
    isFromMe: false,
  },
];

const perform = makePerform("updated-message", (msg) => ({
  id: (msg.guid as string) || `hook-${Date.now()}`,
  guid: msg.guid,
  text: msg.text,
  previousText: msg.previousText ?? msg.originalText ?? undefined,
  editedAt: msg.editedAt ?? msg.dateModified ?? undefined,
  sender:
    (msg.handle as Record<string, unknown>)?.address ?? msg.senderAddress,
  chatGuid:
    Array.isArray(msg.chats) && msg.chats.length > 0
      ? msg.chats[0]
      : msg.chatGuid,
  dateCreated: msg.dateCreated,
  isFromMe: msg.isFromMe ?? false,
}));

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
      chatGuid: "iMessage;-;+11234567890",
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
      { key: "chatGuid", label: "Chat" },
      { key: "dateCreated", label: "Date", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
    ],
  },
});
