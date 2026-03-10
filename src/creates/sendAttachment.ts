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
    key: "fileUrl",
    label: "File URL",
    type: "string",
    required: true,
    helpText: "A publicly accessible URL to the file to send.",
  },
  {
    key: "fileName",
    label: "File Name",
    type: "string",
    required: false,
    helpText: "Custom file name (e.g. photo.jpg). Inferred from URL if omitted.",
  },
  {
    key: "isAudioMessage",
    label: "Send as Audio Message",
    type: "boolean",
    required: false,
    default: "false",
    helpText: "If true, sends as a voice message (file must be .m4a or .caf).",
  },
]);

const perform = (async (z, bundle) => {
  const fileResponse = await z.request({
    url: bundle.inputData.fileUrl,
    raw: true,
  });
  const buffer = await (fileResponse as unknown as Response).arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const fileName =
    bundle.inputData.fileName ||
    bundle.inputData.fileUrl.split("/").pop()?.split("?")[0] ||
    "attachment";

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/attachment/upload`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      name: fileName,
      data: base64,
      isAudioMessage: bundle.inputData.isAudioMessage || false,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || `${bundle.inputData.chatGuid}-attachment`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "send_attachment",
  noun: "Attachment",

  display: {
    label: "Send Attachment",
    description:
      "Send a file, image, or audio message via iMessage. Provide a public URL to the file.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "attachment-1234",
      status: 200,
      message: "Attachment sent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
