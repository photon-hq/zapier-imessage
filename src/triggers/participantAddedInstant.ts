import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "padd-iMessage;+;chat123-1700000000000",
    chatGuid: "iMessage;+;chat123",
    participant: "+11234567890",
  },
];

const perform = makePerform("participant-added", (data) => ({
  id: `padd-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  participant:
    (data.handle as Record<string, unknown>)?.address ?? data.participant,
}));

export default defineTrigger({
  key: "participant_added_instant",
  noun: "Participant",

  display: {
    label: "Participant Added",
    description:
      "Triggers when a participant is added to a group chat on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "padd-iMessage;+;chat123-1700000000000",
      chatGuid: "iMessage;+;chat123",
      participant: "+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Group Chat" },
      { key: "participant", label: "Participant" },
    ],
  },
});
