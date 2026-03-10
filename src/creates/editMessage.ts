import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "messageGuid",
    label: "Message GUID",
    type: "string",
    required: true,
    helpText: "The GUID of the message to edit.",
  },
  {
    key: "editedMessage",
    label: "New Message Text",
    type: "text",
    required: true,
    helpText: "The new text content for the message.",
  },
  {
    key: "backwardsCompatibilityMessage",
    label: "Backwards Compatibility Text",
    type: "text",
    required: false,
    helpText:
      "Text shown to recipients on older devices. Defaults to the new message text.",
  },
  {
    key: "partIndex",
    label: "Part Index",
    type: "integer",
    required: false,
    default: "0",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/edit`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      messageGuid: bundle.inputData.messageGuid,
      editedMessage: bundle.inputData.editedMessage,
      backwardsCompatibilityMessage:
        bundle.inputData.backwardsCompatibilityMessage ||
        bundle.inputData.editedMessage,
      partIndex: bundle.inputData.partIndex ?? 0,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || bundle.inputData.messageGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "edit_message",
  noun: "Message",

  display: {
    label: "Edit Message",
    description: "Edit a previously sent iMessage.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "p:0/fake-guid-1234",
      guid: "p:0/fake-guid-1234",
      text: "Edited message text",
      dateEdited: 1700000000000,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "GUID" },
      { key: "text", label: "Text" },
      { key: "dateEdited", label: "Date Edited", type: "integer" },
    ],
  },
});
