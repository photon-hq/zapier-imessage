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
    key: "stickerUrl",
    label: "Sticker Image URL",
    type: "string",
    required: true,
    helpText: "A publicly accessible URL to the sticker image (PNG recommended).",
  },
  {
    key: "selectedMessageGuid",
    label: "Reply to Message GUID",
    type: "string",
    required: false,
    helpText:
      "If provided, the sticker is attached to this message bubble (reply sticker). Otherwise sent standalone.",
  },
  {
    key: "stickerX",
    label: "Sticker X Position",
    type: "number",
    required: false,
    default: "0.5",
    helpText: "Horizontal position on the message bubble (0-1). Only for reply stickers.",
  },
  {
    key: "stickerY",
    label: "Sticker Y Position",
    type: "number",
    required: false,
    default: "0.5",
    helpText: "Vertical position on the message bubble (0-1). Only for reply stickers.",
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const fileResponse = await z.request({
    url: bundle.inputData.stickerUrl,
    raw: true,
  });
  const buffer = await (fileResponse as unknown as Response).arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const fileName =
    bundle.inputData.stickerUrl.split("/").pop()?.split("?")[0] || "sticker.png";

  const body: Record<string, unknown> = {
    chatGuid: bundle.inputData.chatGuid,
    name: fileName,
    data: base64,
    isSticker: true,
  };

  if (bundle.inputData.selectedMessageGuid) {
    body.selectedMessageGuid = bundle.inputData.selectedMessageGuid;
    body.stickerX = bundle.inputData.stickerX ?? 0.5;
    body.stickerY = bundle.inputData.stickerY ?? 0.5;
    body.stickerScale = 0.75;
    body.stickerRotation = 0;
    body.stickerWidth = 300;
  }

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/attachment/sticker`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || `${bundle.inputData.chatGuid}-sticker`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "send_sticker",
  noun: "Sticker",

  display: {
    label: "Send Sticker",
    description:
      "Send a sticker in iMessage, either standalone or attached to an existing message.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "sticker-1234",
      status: 200,
      message: "Sticker sent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
