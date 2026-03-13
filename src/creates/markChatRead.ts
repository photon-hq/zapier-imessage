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
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}/read`,
    method: "POST",
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "mark_chat_read",
  noun: "Chat",

  display: {
    label: "Mark Chat as Read",
    description: "Mark an iMessage conversation as read.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "mark-read-1234",
      status: 200,
      message: "Chat marked as read",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
