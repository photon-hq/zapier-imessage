import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "p:0/error-guid-1234",
    guid: "p:0/error-guid-1234",
    text: "Failed message",
    error: "Network timeout",
    chatGuid: "iMessage;-;+11234567890",
  },
];

const perform = makePerform("message-send-error", (data) => ({
  id: (data.guid as string) || (data.tempGuid as string) || `err-${Date.now()}`,
  guid: data.guid ?? data.tempGuid,
  text: data.text,
  error: data.error ?? data.message,
  chatGuid: Array.isArray(data.chats) && data.chats.length > 0
    ? data.chats[0]
    : data.chatGuid,
}));

export default defineTrigger({
  key: "message_send_error_instant",
  noun: "Error",

  display: {
    label: "Message Send Error",
    description:
      "Triggers when an iMessage fails to send on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "p:0/error-guid-1234",
      guid: "p:0/error-guid-1234",
      text: "Failed message",
      error: "Network timeout",
      chatGuid: "iMessage;-;+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "GUID" },
      { key: "text", label: "Text" },
      { key: "error", label: "Error Message" },
      { key: "chatGuid", label: "Chat GUID" },
    ],
  },
});
