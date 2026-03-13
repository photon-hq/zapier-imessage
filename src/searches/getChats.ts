import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "limit",
    label: "Max Results",
    type: "integer",
    required: false,
    default: "25",
    helpText: "How many conversations to return (default 25).",
  },
  {
    key: "withLastMessage",
    label: "Include Last Message Preview",
    type: "boolean",
    required: false,
    default: "true",
    helpText: "Include the most recent message text and date for each conversation.",
  },
]);

interface ChatResult {
  guid: string;
  chatIdentifier: string;
  displayName: string | null;
  style: number;
  lastMessage?: { text: string; dateCreated: number };
  participants?: Array<{ address: string }>;
}

const perform = (async (z, bundle) => {
  const response = await z.request<ChatResult[]>({
    url: `${bundle.authData.serverUrl}/api/v1/chat/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      limit: bundle.inputData.limit || 25,
      offset: 0,
      sort: "lastmessage",
      with: bundle.inputData.withLastMessage ? ["lastMessage"] : [],
    },
  });

  const chats: ChatResult[] =
    (response.data as unknown as { data?: ChatResult[] })?.data ??
    (response.data as unknown as ChatResult[]) ??
    [];

  return chats.map((chat) => ({
    id: chat.guid,
    guid: chat.guid,
    chatIdentifier: chat.chatIdentifier,
    displayName: chat.displayName,
    isGroup: chat.style === 43,
    lastMessageText: chat.lastMessage?.text,
    lastMessageDate: chat.lastMessage?.dateCreated,
  }));
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "get_chats",
  noun: "Chat",

  display: {
    label: "Get Chats",
    description: "List iMessage conversations, sorted by most recent.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "iMessage;-;+11234567890",
      guid: "iMessage;-;+11234567890",
      chatIdentifier: "+11234567890",
      displayName: null,
      isGroup: false,
      lastMessageText: "Hey there!",
      lastMessageDate: 1700000000000,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Chat" },
      { key: "chatIdentifier", label: "Phone / Email" },
      { key: "displayName", label: "Name" },
      { key: "isGroup", label: "Group Chat", type: "boolean" },
      { key: "lastMessageText", label: "Last Message" },
      { key: "lastMessageDate", label: "Last Message Date", type: "integer" },
    ],
  },
});
