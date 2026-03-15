import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { randomUUID } from "node:crypto";
import FormData from "form-data";
import { requireInboundMessage, normalizeChatGuid } from "./inboundCheck.js";

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
  const chatGuid = normalizeChatGuid(bundle.inputData.chatGuid as string);
  await requireInboundMessage(z, bundle, chatGuid);
  const fileUrl = bundle.inputData.fileUrl as string;
  let fileResponse: { content?: string; buffer?: () => Promise<Buffer>; status?: number };
  try {
    fileResponse = await z.request({
      url: fileUrl,
      raw: true,
      redirect: "follow",
    }) as unknown as { content?: string; buffer?: () => Promise<Buffer>; status?: number };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new z.errors.Error(
      `Could not fetch file from URL: ${msg}. Use a direct, publicly accessible link to the file.`,
      "FetchError",
    );
  }
  let buffer: Buffer;
  if (typeof fileResponse.buffer === "function") {
    buffer = await fileResponse.buffer();
  } else if (fileResponse.content != null) {
    buffer = Buffer.isBuffer(fileResponse.content)
      ? fileResponse.content
      : Buffer.from(fileResponse.content, typeof fileResponse.content === "string" ? "utf8" : undefined);
  } else {
    const raw = fileResponse as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> };
    if (typeof raw.arrayBuffer === "function") {
      buffer = Buffer.from(await raw.arrayBuffer());
    } else {
      throw new z.errors.Error(
        "Could not read file data from URL. Use a direct link to an image or file (no redirects or HTML pages).",
        "InvalidAttachment",
      );
    }
  }
  if (!buffer || buffer.length === 0) {
    throw new z.errors.Error(
      "Attachment was empty or could not be downloaded. Use a direct URL to a non-empty file.",
      "EmptyAttachment",
    );
  }

  const fileName =
    bundle.inputData.fileName ||
    fileUrl.split("/").pop()?.split("?")[0] ||
    "attachment";

  const form = new FormData();
  form.append("chatGuid", chatGuid);
  form.append("attachment", buffer, { filename: fileName });
  form.append("name", fileName);
  form.append("tempGuid", randomUUID());
  form.append("isAudioMessage", String(bundle.inputData.isAudioMessage === true));
  if (bundle.inputData.isAudioMessage === true) {
    form.append("method", "private-api");
  }

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/attachment`,
    method: "POST",
    headers: form.getHeaders(),
    body: form,
  });

  const data = response.data as Record<string, unknown>;
  const out = data?.data ?? data;
  const result = (typeof out === "object" && out !== null ? out : {}) as Record<string, unknown>;
  return {
    id: result.guid ?? result.id ?? `${chatGuid}-attachment`,
    ...result,
  };
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
