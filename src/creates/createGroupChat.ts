import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundForAddresses } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "addresses",
    label: "Participants",
    type: "string",
    required: true,
    helpText:
      "Phone numbers or emails of people to add, separated by commas. E.g. +1234567890, +0987654321, john@icloud.com",
  },
  {
    key: "message",
    label: "First Message",
    type: "text",
    required: false,
    helpText: "Send a message when creating the group. Leave blank to create it empty.",
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
      { key: "guid", label: "Group Chat ID" },
      { key: "displayName", label: "Group Name" },
    ],
  },
});
