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
    type: "string",
    required: true,
    helpText: "When to send: a future date/time (e.g. 2025-01-15 9:00 AM) or a number of minutes from now (e.g. 2 or 5).",
  },
  {
    key: "scheduleType",
    label: "Repeat",
    type: "string",
    required: false,
    default: "once",
    helpText: "Send the message once or on a recurring schedule.",
    choices: [
      { value: "once", label: "Send Once", sample: "once" },
      { value: "hourly", label: "Every Hour", sample: "hourly" },
      { value: "daily", label: "Every Day", sample: "daily" },
      { value: "weekly", label: "Every Week", sample: "weekly" },
      { value: "monthly", label: "Every Month", sample: "monthly" },
      { value: "yearly", label: "Every Year", sample: "yearly" },
    ],
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const raw = bundle.inputData.scheduledFor;
  let scheduledFor: number;
  const num = typeof raw === "string" ? parseInt(raw.trim(), 10) : Number(raw);
  if (Number.isInteger(num) && num > 0 && num <= 60 * 24 * 365) {
    scheduledFor = Date.now() + num * 60 * 1000;
  } else {
    scheduledFor = new Date(raw as string | number).getTime();
  }
  if (scheduledFor <= Date.now()) {
    throw new z.errors.Error(
      "Send At must be in the future. Use a future date/time or a number of minutes from now (e.g. 2 or 5).",
      "ValidationError",
    );
  }

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
