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
    helpText: "The group chat GUID, e.g. iMessage;+;chat123",
    dynamic: "list_chats.id.displayName",
  },
  {
    key: "address",
    label: "Participant Address",
    type: "string",
    required: true,
    helpText: "Phone number or email to add, e.g. +1234567890",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}/participant/add`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { address: bundle.inputData.address },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || `${bundle.inputData.chatGuid}-${bundle.inputData.address}`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "add_participant",
  noun: "Participant",

  display: {
    label: "Add Participant to Group",
    description: "Add a participant to an existing iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "participant-add-1234",
      status: 200,
      message: "Participant added successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
