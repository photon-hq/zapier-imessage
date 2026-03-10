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
  {
    key: "imageUrl",
    label: "Background Image URL",
    type: "string",
    required: true,
    helpText: "A publicly accessible URL to the background image.",
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
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}/background`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { fileData: base64 },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "set_chat_background",
  noun: "Chat Background",

  display: {
    label: "Set Chat Background",
    description: "Set a custom background image for an iMessage chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "background-1234",
      status: 200,
      message: "Background set successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
