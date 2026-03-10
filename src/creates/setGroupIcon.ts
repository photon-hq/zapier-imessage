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
    key: "imageUrl",
    label: "Icon Image URL",
    type: "string",
    required: true,
    helpText: "A publicly accessible URL to the group icon image.",
  },
]);

const perform = (async (z, bundle) => {
  const fileResponse = await z.request({
    url: bundle.inputData.imageUrl,
    raw: true,
  });
  const buffer = await (fileResponse as unknown as Response).arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}/icon`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { fileData: base64 },
  });

  return response.data;
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "set_group_icon",
  noun: "Group Icon",

  display: {
    label: "Set Group Icon",
    description: "Set the icon image for an iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      status: 200,
      message: "Group icon set successfully",
    },
  },
});
