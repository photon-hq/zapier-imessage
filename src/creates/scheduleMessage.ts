import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat",
    type: "string",
    required: true,
    helpText:
      "Phone number, email, or group chat ID. Usually mapped from a trigger step (e.g. +1234567890 or a Chat GUID).",
  },
  {
    key: "message",
    label: "Message Text",
    type: "text",
    required: true,
    helpText: "The message to send at the scheduled time.",
  },
  {
    key: "scheduledFor",
    label: "Send At",
    type: "datetime",
    required: true,
    helpText: "When to send the message. Use a date/time from a previous step or type one (e.g. 2025-01-15 9:00 AM).",
  },
  {
    key: "scheduleType",
    label: "Repeat",
    type: "string",
    required: false,
    default: "once",
    helpText: "Send the message once or on a recurring schedule.",
    choices: {
      once: "Send Once",
      hourly: "Every Hour",
      daily: "Every Day",
      weekly: "Every Week",
      monthly: "Every Month",
      yearly: "Every Year",
    },
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const scheduledFor = new Date(bundle.inputData.scheduledFor).getTime();

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/schedule`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      type: "send-message",
      payload: {
        chatGuid: bundle.inputData.chatGuid,
        message: bundle.inputData.message,
        method: "private-api",
      },
      scheduledFor,
      schedule: {
        type: bundle.inputData.scheduleType || "once",
      },
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: String(data.id || Date.now()), ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "schedule_message",
  noun: "Scheduled Message",

  display: {
    label: "Schedule a Message",
    description: "Schedule an iMessage to be sent at a future time.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "1",
      type: "send-message",
      scheduledFor: 1700000000000,
      status: "scheduled",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "type", label: "Schedule Type" },
      { key: "scheduledFor", label: "Scheduled For", type: "integer" },
      { key: "status", label: "Status" },
    ],
  },
});
