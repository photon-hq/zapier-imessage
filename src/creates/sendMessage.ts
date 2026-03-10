import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { randomUUID } from "node:crypto";

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
    key: "message",
    label: "Message Text",
    type: "text",
    required: true,
  },
  {
    key: "method",
    label: "Send Method",
    type: "string",
    required: false,
    default: "apple-script",
    choices: {
      "apple-script": "Apple Script",
      "private-api": "Private API",
    },
  },
  {
    key: "subject",
    label: "Subject",
    type: "string",
    required: false,
  },
  {
    key: "effectId",
    label: "Message Effect ID",
    type: "string",
    required: false,
    helpText: "e.g. com.apple.messages.effect.CKConfettiEffect",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/text`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      message: bundle.inputData.message,
      method: bundle.inputData.method || "apple-script",
      subject: bundle.inputData.subject || undefined,
      effectId: bundle.inputData.effectId || undefined,
      tempGuid: randomUUID(),
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "send_message",
  noun: "Message",

  display: {
    label: "Send Message",
    description: "Send an iMessage from your Photon server.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "p:0/sent-guid-1234",
      status: 200,
      message: "Message sent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
