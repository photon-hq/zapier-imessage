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
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}`,
    method: "DELETE",
  });

  return response.data;
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "delete_chat",
  noun: "Chat",

  display: {
    label: "Delete Chat",
    description: "Delete an iMessage conversation.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      status: 200,
      message: "Chat deleted successfully",
    },
  },
});
