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
    helpText: "Phone number or email to add, e.g. +1234567890",
  },
]);

const perform = (async (z, bundle) => {
  const chatGuid = normalizeChatGuid(bundle.inputData.chatGuid as string);
  await requireInboundMessage(z, bundle, chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(chatGuid)}/participant/add`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { address: bundle.inputData.address },
  });

  const data = response.data as Record<string, unknown>;
  const id = (data.id ?? data.ID ?? `${chatGuid}-${bundle.inputData.address}`) as string;
  const status = (data.status ?? data.Status ?? 200) as number;
  const message = (data.message ?? data.Message ?? "Success") as string;
  return { id, status, message, chatGuid, address: bundle.inputData.address, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "add_participant",
  noun: "Participant",

  display: {
    label: "Add Participant to Group",
    description: "Add a participant to an existing iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "618498117be84f15b83d6ad1ea918865-+918527438574",
      status: 200,
      message: "Success",
      chatGuid: "any;+;618498117be84f15b83d6ad1ea918865",
      address: "+918527438574",
      data: {
        displayName: "Photon MCP Test GC",
        guid: "618498117be84f15b83d6ad1ea918865",
        chatIdentifier: "618498117be84f15b83d6ad1ea918865",
      },
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "address", label: "Address" },
      { key: "data", label: "Chat Data", dict: true },
    ],
  },
});
