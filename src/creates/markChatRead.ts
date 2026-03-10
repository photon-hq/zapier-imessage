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
    dynamic: "list_chats.id.displayName",
  },
]);

const perform = (async (z, bundle) => {
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
