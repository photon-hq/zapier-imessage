import { defineTrigger } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const perform = makePerform("updated-message", (msg) => ({
  id: (msg.guid as string) || `hook-${Date.now()}`,
  guid: msg.guid,
  text: msg.text,
  sender:
    (msg.handle as Record<string, unknown>)?.address ?? msg.senderAddress,
  dateCreated: msg.dateCreated,
  isFromMe: msg.isFromMe ?? false,
}));

export default defineTrigger({
  key: "message_updated_instant",
  noun: "Message",

  display: {
    label: "Message Updated (Deprecated)",
    description:
      "Triggers when an iMessage is edited or updated on your Photon server.",
    hidden: true,
  },

  operation: {
    type: "hook",
    perform,
    performList: async () => [],
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "p:0/sample-updated-msg-1",
      guid: "p:0/sample-updated-msg-1",
      text: "Edited message text",
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
