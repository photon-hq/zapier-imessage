import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "gicon-iMessage;+;chat123-1700000000000",
    chatGuid: "iMessage;+;chat123",
  },
];

const perform = makePerform("group-icon-changed", (data) => ({
  id: `gicon-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
}));

export default defineTrigger({
  key: "group_icon_changed_instant",
  noun: "Group Icon",

  display: {
    label: "Group Icon Changed (Instant)",
    description:
      "Triggers when a group chat icon is changed on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "gicon-iMessage;+;chat123-1700000000000",
      chatGuid: "iMessage;+;chat123",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat GUID" },
    ],
  },
});
