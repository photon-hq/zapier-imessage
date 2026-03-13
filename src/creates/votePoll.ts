import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

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
    key: "pollMessageGuid",
    label: "Poll Message GUID",
    type: "string",
    required: true,
    helpText: "The GUID of the poll message to vote on.",
  },
  {
    key: "optionIdentifier",
    label: "Option Identifier",
    type: "string",
    required: true,
    helpText: "The UUID of the poll option to vote for.",
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
