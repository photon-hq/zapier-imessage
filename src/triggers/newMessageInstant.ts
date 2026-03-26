import { defineTrigger } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

function transformMessage(msg: Record<string, unknown>) {
  return {
    id: (msg.guid as string) || `hook-${Date.now()}`,
    guid: msg.guid,
    text: msg.text,
    sender:
      (msg.handle as Record<string, unknown>)?.address ?? msg.senderAddress,
    dateCreated: msg.dateCreated,
    isFromMe: msg.isFromMe ?? false,
  };
}

const perform = makePerform(
  "new-message",
  transformMessage,
  (msg) => !msg.isFromMe,
);

const performList = async () => [];

export default defineTrigger({
  key: "new_message_instant",
  noun: "Message",

  display: {
    label: "New Message Received",
    description:
      "Triggers when a new iMessage is received on your Photon server.",
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
      dateCreated: 1700000000000,
      isFromMe: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Message ID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "dateCreated", label: "Date", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
    ],
  },
});
