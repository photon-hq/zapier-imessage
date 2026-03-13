import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "read-iMessage;-;+11234567890-1700000000000",
    chatGuid: "iMessage;-;+11234567890",
    isRead: true,
  },
];

const perform = makePerform("chat-read-status-changed", (data) => ({
  id: `read-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  isRead: data.isRead ?? data.read,
}));

export default defineTrigger({
  key: "chat_read_status_instant",
  noun: "Read Status",

  display: {
    label: "Chat Read Status Changed",
    description:
      "Triggers when a chat's read status changes on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "read-iMessage;-;+11234567890-1700000000000",
      chatGuid: "iMessage;-;+11234567890",
      isRead: true,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat" },
      { key: "isRead", label: "Read", type: "boolean" },
    ],
  },
});
