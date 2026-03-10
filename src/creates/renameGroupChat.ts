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
  },
  {
    key: "displayName",
    label: "New Group Name",
    type: "string",
    required: true,
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { displayName: bundle.inputData.displayName },
  });

  return response.data;
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "rename_group_chat",
  noun: "Group Chat",

  display: {
    label: "Rename Group Chat",
    description: "Change the display name of an iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      guid: "iMessage;+;chat123",
      displayName: "New Group Name",
    },
  },
});
