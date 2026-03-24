import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage, normalizeChatGuid } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Group Chat",
    type: "string",
    required: true,
    helpText:
      "The group chat identifier. Usually mapped from a trigger step.",
  },
  {
    key: "address",
    label: "Phone Number or Email",
    type: "string",
    required: true,
    helpText: "Phone number or email to remove, e.g. +1234567890",
  },
]);

const perform = (async (z, bundle) => {
  const chatGuid = normalizeChatGuid(bundle.inputData.chatGuid as string);
  await requireInboundMessage(z, bundle, chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(chatGuid)}/participant/remove`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { address: bundle.inputData.address },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || `${chatGuid}-${bundle.inputData.address}`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "remove_participant",
  noun: "Participant",

  display: {
    label: "Remove Participant From Group",
    description: "Remove a participant from an iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "participant-remove-1234",
      status: 200,
      message: "Participant removed successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
