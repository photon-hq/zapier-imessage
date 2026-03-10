import {
  defineTrigger,
  type PollingTriggerPerform,
} from "zapier-platform-core";

interface ChatResult {
  guid: string;
  chatIdentifier: string;
  displayName: string | null;
  style: number;
}

const perform = (async (z, bundle) => {
  const response = await z.request<ChatResult[]>({
    url: `${bundle.authData.serverUrl}/api/v1/chat/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { limit: 50, offset: 0, sort: "lastmessage" },
  });

  const chats: ChatResult[] =
    (response.data as unknown as { data?: ChatResult[] })?.data ??
    (response.data as unknown as ChatResult[]) ??
    [];

  return chats.map((chat) => ({
    id: chat.guid,
    chatIdentifier: chat.chatIdentifier,
    displayName: chat.displayName || chat.chatIdentifier,
  }));
}) satisfies PollingTriggerPerform;

export default defineTrigger({
  key: "list_chats",
  noun: "Chat",

  display: {
    label: "List Chats",
    description: "Triggers when listing chats for dynamic dropdowns.",
    hidden: true,
  },

  operation: {
    type: "polling",
    perform,
    sample: {
      id: "iMessage;-;+11234567890",
      chatIdentifier: "+11234567890",
      displayName: "+11234567890",
    },
  },
});
