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
    helpText: "The group chat GUID, e.g. iMessage;+;chat123",
    dynamic: "list_chats.id.displayName",
  },
  {
    key: "displayName",
    label: "New Group Name",
    type: "string",
    required: true,
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { displayName: bundle.inputData.displayName },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "rename_group_chat",
  noun: "Group Chat",

  display: {
    label: "Rename Group Chat",
    description: "Change the display name of an iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "iMessage;+;chat123",
      guid: "iMessage;+;chat123",
      displayName: "New Group Name",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Chat GUID" },
      { key: "displayName", label: "Display Name" },
    ],
  },
});
