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
    helpText: "The GUID of the message to unsend.",
  },
  {
    key: "partIndex",
    label: "Part Index",
    type: "integer",
    required: false,
    default: "0",
    helpText: "The part index of the message (default 0).",
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
