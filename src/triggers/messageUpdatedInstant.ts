import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "p:0/fake-guid-1234",
    guid: "p:0/fake-guid-1234",
    text: "Edited message text",
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
      id: "p:0/fake-guid-1234",
      guid: "p:0/fake-guid-1234",
      text: "Edited message text",
      sender: "+11234567890",
      chatGuid: "iMessage;-;+11234567890",
      dateCreated: 1700000000000,
      isFromMe: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "GUID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "dateCreated", label: "Date Created", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
    ],
  },
});
