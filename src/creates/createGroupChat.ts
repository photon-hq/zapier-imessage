import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundForAddresses } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "addresses",
    label: "Participant Addresses",
    type: "string",
    required: true,
    helpText:
      "Comma-separated phone numbers or emails, e.g. +1234567890,+0987654321",
  },
  {
    key: "message",
    label: "Initial Message",
    type: "text",
    required: false,
    helpText: "Optional message to send when creating the chat.",
  },
]);

const perform = (async (z, bundle) => {
  const addresses = bundle.inputData.addresses
    .split(",")
    .map((a: string) => a.trim())
    .filter(Boolean);

  await requireInboundForAddresses(z, bundle, addresses);

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/new`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      addresses,
      message: bundle.inputData.message || undefined,
      service: "iMessage",
      method: "private-api",
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || `group-${Date.now()}`, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "create_group_chat",
  noun: "Group Chat",

  display: {
    label: "Create Group Chat",
    description: "Create a new iMessage group conversation.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "iMessage;+;chat123456789",
      guid: "iMessage;+;chat123456789",
      displayName: "New Group",
      participants: ["+1234567890", "+0987654321"],
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Chat GUID" },
      { key: "displayName", label: "Display Name" },
    ],
  },
});
