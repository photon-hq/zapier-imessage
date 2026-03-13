import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat",
    type: "string",
    required: true,
    helpText:
      "Phone number, email, or group chat ID. Usually mapped from a trigger step (e.g. +1234567890 or a Chat GUID).",
  },
  {
    key: "fileUrl",
    label: "File URL",
    type: "string",
    required: true,
    helpText: "A public URL to the file to send (image, video, PDF, etc.). Map from a previous step or paste a link.",
  },
  {
    key: "fileName",
    label: "Custom File Name",
    type: "string",
    required: false,
    helpText: "Override the file name (e.g. photo.jpg). Auto-detected if left blank.",
  },
  {
    key: "isAudioMessage",
    label: "Send as Voice Message",
    type: "boolean",
    required: false,
    default: "false",
    helpText: "Send as a playable voice message instead of a file. The file must be .caf or .m4a audio.",
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
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
      method: "private-api",
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
