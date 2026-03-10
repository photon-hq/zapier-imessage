import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat GUID",
    type: "string",
    required: true,
    helpText: "The chat GUID, e.g. iMessage;+;chat123 for a group",
    dynamic: "list_chats.id.displayName",
  },
]);

interface Participant {
  address: string;
  service: string;
}

const perform = (async (z, bundle) => {
  const response = await z.request<{
    participants?: Participant[];
    guid: string;
    displayName: string | null;
  }>({
    url: `${bundle.authData.serverUrl}/api/v1/chat/${encodeURIComponent(bundle.inputData.chatGuid)}`,
    method: "GET",
    params: { with: "participants" },
  });

  const chat = response.data;
  const participants = chat.participants ?? [];

  return participants.map((p, i) => ({
    id: `${chat.guid}-${p.address}`,
    chatGuid: chat.guid,
    displayName: chat.displayName,
    address: p.address,
    service: p.service,
    index: i,
  }));
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "get_chat_participants",
  noun: "Participant",

  display: {
    label: "Get Chat Participants",
    description: "Get the participants of an iMessage group chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "iMessage;+;chat123-+11234567890",
      chatGuid: "iMessage;+;chat123",
      displayName: "My Group",
      address: "+11234567890",
      service: "iMessage",
      index: 0,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "displayName", label: "Group Name" },
      { key: "address", label: "Participant Address" },
      { key: "service", label: "Service" },
      { key: "index", label: "Index", type: "integer" },
    ],
  },
});
