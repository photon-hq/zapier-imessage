import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

interface PhotonMessage {
  guid: string;
  text: string;
  handle?: { address: string };
  chats?: string[];
  dateCreated: number;
}

const inputFields = defineInputFields([
  {
    key: "query",
    label: "Search Text",
    type: "string",
    required: true,
    helpText: "Find messages containing this text.",
  },
  {
    key: "chatGuid",
    label: "Limit to Chat",
    type: "string",
    required: false,
    helpText: "Only search within a specific conversation. Leave blank to search all chats.",
  },
  {
    key: "limit",
    label: "Max Results",
    type: "integer",
    required: false,
    default: "10",
    helpText: "How many messages to return (default 10).",
  },
]);

const perform = (async (z, bundle) => {
  const body: Record<string, unknown> = {
    where: [
      {
        statement: "message.text LIKE :text",
        args: { text: `%${bundle.inputData.query}%` },
      },
    ],
    limit: bundle.inputData.limit || 10,
    sort: "DESC",
  };

  if (bundle.inputData.chatGuid) {
    body.chatGuid = bundle.inputData.chatGuid;
  }

  const response = await z.request<{ data?: PhotonMessage[] }>({
    url: `${bundle.authData.serverUrl}/api/v1/message/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const messages: PhotonMessage[] =
    response.data?.data ?? (response.data as unknown as PhotonMessage[]) ?? [];

  return messages.map((msg) => ({
    id: msg.guid,
    guid: msg.guid,
    text: msg.text,
    sender: msg.handle?.address,
    chatGuid: msg.chats?.[0],
    dateCreated: msg.dateCreated,
  }));
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "find_messages",
  noun: "Message",

  display: {
    label: "Find Messages",
    description: "Search for messages by text content.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "p:0/fake-guid-5678",
      guid: "p:0/fake-guid-5678",
      text: "Found message text",
      sender: "+11234567890",
      chatGuid: "iMessage;-;+11234567890",
      dateCreated: 1700000000000,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Message ID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "chatGuid", label: "Chat" },
      { key: "dateCreated", label: "Date", type: "integer" },
    ],
  },
});
