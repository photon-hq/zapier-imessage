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
    key: "messageGuid",
    label: "Message",
    type: "string",
    required: true,
    helpText: "The message to react to. Map this from a trigger or search step.",
  },
  {
    key: "reaction",
    label: "Reaction",
    type: "string",
    required: true,
    choices: {
      love: "Love ❤️",
      like: "Like 👍",
      dislike: "Dislike 👎",
      laugh: "Laugh 😂",
      emphasize: "Emphasize ‼️",
      question: "Question ❓",
      "-love": "Remove Love",
      "-like": "Remove Like",
      "-dislike": "Remove Dislike",
      "-laugh": "Remove Laugh",
      "-emphasize": "Remove Emphasize",
      "-question": "Remove Question",
    },
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/react`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      selectedMessageGuid: bundle.inputData.messageGuid,
      reaction: bundle.inputData.reaction,
      partIndex: 0,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || `${bundle.inputData.messageGuid}-${bundle.inputData.reaction}`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "react_message",
  noun: "Reaction",

  display: {
    label: "React to Message",
    description: "Send a tapback reaction to a message.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "reaction-1234",
      status: 200,
      message: "Reaction sent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
