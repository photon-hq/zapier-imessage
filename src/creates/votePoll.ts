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
    key: "pollMessageGuid",
    label: "Poll Message",
    type: "string",
    required: true,
    helpText: "The poll message to vote on. Map this from a trigger or search step.",
  },
  {
    key: "optionIdentifier",
    label: "Poll Option",
    type: "string",
    required: true,
    helpText: "The identifier of the option to vote for. Map this from the poll data in a previous step.",
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/poll/vote`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      pollMessageGuid: bundle.inputData.pollMessageGuid,
      optionIdentifier: bundle.inputData.optionIdentifier,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || `${bundle.inputData.pollMessageGuid}-${bundle.inputData.optionIdentifier}`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "vote_poll",
  noun: "Poll Vote",

  display: {
    label: "Vote on Poll",
    description: "Cast a vote on a poll option in iMessage.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "vote-1234",
      status: 200,
      message: "Vote cast successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
