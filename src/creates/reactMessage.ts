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
    helpText: "The message GUID to react to. Map from a New Message trigger (Message ID / guid) or from Find Messages search (guid).",
  },
  {
    key: "reaction",
    label: "Reaction",
    type: "string",
    required: true,
    choices: [
      { value: "love", label: "Love ❤️", sample: "love" },
      { value: "like", label: "Like 👍", sample: "like" },
      { value: "dislike", label: "Dislike 👎", sample: "dislike" },
      { value: "laugh", label: "Laugh 😂", sample: "laugh" },
      { value: "emphasize", label: "Emphasize ‼️", sample: "emphasize" },
      { value: "question", label: "Question ❓", sample: "question" },
      { value: "-love", label: "Remove Love", sample: "-love" },
      { value: "-like", label: "Remove Like", sample: "-like" },
      { value: "-dislike", label: "Remove Dislike", sample: "-dislike" },
      { value: "-laugh", label: "Remove Laugh", sample: "-laugh" },
      { value: "-emphasize", label: "Remove Emphasize", sample: "-emphasize" },
      { value: "-question", label: "Remove Question", sample: "-question" },
    ],
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
