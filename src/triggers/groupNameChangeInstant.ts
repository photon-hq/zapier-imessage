import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "grpname-iMessage;+;chat123-1700000000000",
    chatGuid: "iMessage;+;chat123",
    newName: "New Group Name",
    oldName: "Old Group Name",
  },
];

const perform = makePerform("group-name-change", (data) => ({
  id: `grpname-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  newName: data.newName ?? data.displayName,
  oldName: data.oldName,
}));

export default defineTrigger({
  key: "group_name_change_instant",
  noun: "Group Name",

  display: {
    label: "Group Name Changed (Instant)",
    description:
      "Triggers when a group chat is renamed on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "grpname-iMessage;+;chat123-1700000000000",
      chatGuid: "iMessage;+;chat123",
      newName: "New Group Name",
      oldName: "Old Group Name",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "newName", label: "New Name" },
      { key: "oldName", label: "Old Name" },
    ],
  },
});
