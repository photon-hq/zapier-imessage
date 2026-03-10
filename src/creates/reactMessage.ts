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
  },
  {
    key: "messageGuid",
    label: "Message GUID",
    type: "string",
    required: true,
    helpText: "The GUID of the message to react to.",
  },
  {
    key: "reaction",
    label: "Reaction",
    type: "string",
    required: true,
    choices: {
      love: "Love",
      like: "Like",
      dislike: "Dislike",
      laugh: "Laugh",
      emphasize: "Emphasize",
      question: "Question",
    },
  },
]);

const perform = (async (z, bundle) => {
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

  return response.data;
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
      status: 200,
      message: "Reaction sent successfully",
    },
  },
});
