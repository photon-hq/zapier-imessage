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

  return response.data;
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
      status: 200,
      message: "Message unsent successfully",
    },
  },
});
