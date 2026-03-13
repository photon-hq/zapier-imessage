import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat GUID",
    type: "string",
    required: true,
    helpText:
      "e.g. iMessage;-;+1234567890 for a DM or iMessage;+;chat123 for a group",
  },
  {
    key: "message",
    label: "Message Text",
    type: "text",
    required: true,
  },
  {
    key: "scheduledFor",
    label: "Send At",
    type: "datetime",
    required: true,
    helpText: "The date and time to send the message.",
  },
  {
    key: "scheduleType",
    label: "Repeat",
    type: "string",
    required: false,
    default: "once",
    choices: {
      once: "Once",
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
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
