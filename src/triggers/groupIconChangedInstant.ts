import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, assertValidSignature } from "./webhookHelpers.js";

const ICON_EVENTS = new Set(["group-icon-changed", "group-icon-removed"]);

const perform = async (z: ZObject, bundle: Bundle) => {
  assertValidSignature(z, bundle);

  const payload = bundle.cleanedRequest as {
    event?: string;
    data?: Record<string, unknown>;
  };

  if (!payload?.data || !payload.event || !ICON_EVENTS.has(payload.event)) {
    return [];
  }

  const d = payload.data;
  return [
    {
      id: `gicon-${d.chatGuid || d.guid}-${Date.now()}`,
      event: payload.event,
      chatGuid: d.chatGuid ?? d.guid,
    },
  ];
};

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "gicon-iMessage;+;chat123-1700000000000",
    event: "group-icon-changed",
    chatGuid: "iMessage;+;chat123",
  },
];

export default defineTrigger({
  key: "group_icon_changed_instant",
  noun: "Group Icon",

  display: {
    label: "Group Icon Changed",
    description:
      "Triggers when a group chat icon is changed or removed on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "gicon-iMessage;+;chat123-1700000000000",
      event: "group-icon-changed",
      chatGuid: "iMessage;+;chat123",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "event", label: "Event Type" },
      { key: "chatGuid", label: "Group Chat" },
    ],
  },
});
