import {
  defineTrigger,
  type WebhookTriggerPerformList,
} from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe } from "./webhookHelpers.js";
import { normalizeUrl } from "../authentication.js";

const performList = (async (z: ZObject, bundle: Bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  try {
    const response = await z.request<{
      data?: Array<{
        guid?: string;
        id?: string;
        text?: string;
        chatGuid?: string;
        chats?: string[];
        scheduledDate?: number;
        scheduledFor?: number;
        scheduledAt?: number;
        status?: string;
        error?: string | null;
      }>;
    }>({
      url: `${serverUrl}/api/v1/message/schedule`,
      method: "GET",
    });
    const list = response.data?.data ?? (Array.isArray(response.data) ? response.data : []);
    return list.map((d, i) => ({
      id: (d.guid ?? d.id ?? `sched-${i}`) as string,
      event: "scheduled-message-sent",
      guid: d.guid ?? d.id ?? `sched-${i}`,
      text: d.text ?? "",
      chatGuid: d.chatGuid ?? d.chats?.[0],
      scheduledDate: d.scheduledDate ?? d.scheduledFor ?? d.scheduledAt ?? 0,
      error: d.error ?? null,
    }));
  } catch {
    // No list endpoint or error; live data comes from webhooks only.
    return [];
  }
}) satisfies WebhookTriggerPerformList;

const SCHEDULED_EVENTS = new Set([
  "scheduled-message-created",
  "scheduled-message-updated",
  "scheduled-message-deleted",
  "scheduled-message-sent",
  "scheduled-message-error",
]);

const perform = async (_z: ZObject, bundle: Bundle) => {
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
