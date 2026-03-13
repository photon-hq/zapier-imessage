import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "messageGuid",
    label: "Message",
    type: "string",
    required: true,
    helpText: "The message ID to unsend. Map this from a trigger or previous step.",
  },
  {
    key: "partIndex",
    label: "Message Part",
    type: "integer",
    required: false,
    default: "0",
    helpText: "Which part of the message to unsend (0 for the main text). Usually leave at 0.",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/unsend`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      messageGuid: bundle.inputData.messageGuid,
      partIndex: bundle.inputData.partIndex ?? 0,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || bundle.inputData.messageGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "unsend_message",
  noun: "Message",

  display: {
    label: "Unsend Message",
    description: "Retract a previously sent iMessage.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "unsend-1234",
      status: 200,
      message: "Message unsent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
