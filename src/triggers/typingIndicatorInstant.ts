import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "typing-iMessage;-;+11234567890-1700000000000",
    chatGuid: "iMessage;-;+11234567890",
    display: true,
    sender: "+11234567890",
  },
];

const perform = makePerform("typing-indicator", (data) => ({
  id: `typing-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  display: data.display ?? data.typing,
  sender: (data.handle as Record<string, unknown>)?.address ?? data.senderAddress,
}));

export default defineTrigger({
  key: "typing_indicator_instant",
  noun: "Typing Indicator",

  display: {
    label: "Typing Indicator",
    description:
      "Triggers when someone starts or stops typing in an iMessage conversation.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "typing-iMessage;-;+11234567890-1700000000000",
      chatGuid: "iMessage;-;+11234567890",
      display: true,
      sender: "+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat" },
      { key: "display", label: "Currently Typing", type: "boolean" },
      { key: "sender", label: "Sender" },
    ],
  },
});
