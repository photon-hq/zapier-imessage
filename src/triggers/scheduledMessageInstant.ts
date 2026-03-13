import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, assertValidSignature } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "sched-sample-msg-1",
    event: "scheduled-message-sent",
    guid: "sched-sample-msg-1",
    text: "Reminder: meeting at 3pm",
    chatGuid: "iMessage;-;+11234567890",
    scheduledDate: 1700100000000,
    error: null,
  },
];

const SCHEDULED_EVENTS = new Set([
  "scheduled-message-created",
  "scheduled-message-updated",
  "scheduled-message-deleted",
  "scheduled-message-sent",
  "scheduled-message-error",
]);

const perform = async (z: ZObject, bundle: Bundle) => {
  assertValidSignature(z, bundle);

  const payload = bundle.cleanedRequest as {
    event?: string;
    data?: Record<string, unknown>;
  };

  if (!payload?.data || !payload.event || !SCHEDULED_EVENTS.has(payload.event)) {
    return [];
  }

  const d = payload.data;
  return [
    {
      id: (d.guid as string) || (d.id as string) || `sched-${Date.now()}`,
      event: payload.event,
      guid: d.guid ?? d.id,
      text: d.text,
      chatGuid: Array.isArray(d.chats) && d.chats.length > 0
        ? d.chats[0]
        : d.chatGuid,
      scheduledDate: d.scheduledDate ?? d.scheduledAt,
      error: d.error,
    },
  ];
};

export default defineTrigger({
  key: "scheduled_message_instant",
  noun: "Scheduled Message",

  display: {
    label: "Scheduled Message Event",
    description:
      "Triggers when a scheduled message is created, updated, sent, deleted, or errors on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "sched-sample-msg-1",
      event: "scheduled-message-sent",
      guid: "sched-sample-msg-1",
      text: "Reminder: meeting at 3pm",
      chatGuid: "iMessage;-;+11234567890",
      scheduledDate: 1700100000000,
      error: null,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "event", label: "Event Type" },
      { key: "guid", label: "Message ID" },
      { key: "text", label: "Text" },
      { key: "chatGuid", label: "Chat" },
      { key: "scheduledDate", label: "Send At", type: "integer" },
      { key: "error", label: "Error" },
    ],
  },
});
