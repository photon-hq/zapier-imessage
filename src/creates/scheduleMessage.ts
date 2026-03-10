import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";

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
        method: "apple-script",
      },
      scheduledFor,
      schedule: {
        type: bundle.inputData.scheduleType || "once",
      },
    },
  });

  return response.data;
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
      id: 1,
      type: "send-message",
      scheduledFor: 1700000000000,
      status: "scheduled",
    },
  },
});
