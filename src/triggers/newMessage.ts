import {
  defineTrigger,
  type PollingTriggerPerform,
} from "zapier-platform-core";

interface PhotonMessage {
  guid: string;
  text: string;
  handle?: { address: string };
  chats?: string[];
  dateCreated: number;
  isFromMe: boolean;
  attachments?: unknown[];
}

const perform = (async (z, bundle) => {
  const cursor = await z.cursor.get();
  const after =
    bundle.meta.isLoadingSample || !cursor ? 0 : parseInt(cursor, 10);

  const response = await z.request<{ data?: PhotonMessage[] }>({
    url: `${bundle.authData.serverUrl}/api/v1/message/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { sort: "DESC", limit: 10, after },
  });

  const messages: PhotonMessage[] =
    response.data?.data ?? (response.data as unknown as PhotonMessage[]) ?? [];

  const received = messages
    .filter((msg) => !msg.isFromMe)
    .map((msg) => ({
      id: msg.guid,
      guid: msg.guid,
      text: msg.text,
      sender: msg.handle?.address,
      chatGuid: msg.chats?.[0],
      dateCreated: msg.dateCreated,
      isFromMe: msg.isFromMe,
      hasAttachments: (msg.attachments?.length ?? 0) > 0,
    }));

  if (received.length > 0) {
    const newest = Math.max(...received.map((m) => m.dateCreated));
    await z.cursor.set(String(newest));
  }

  return received;
}) satisfies PollingTriggerPerform;

export default defineTrigger({
  key: "new_message",
  noun: "Message",

  display: {
    label: "New Message Received",
    description:
      "Triggers when a new iMessage is received on your Photon iMessage server.",
  },

  operation: {
    type: "polling",
    canPaginate: true,
    perform,
    sample: {
      id: "p:0/fake-guid-1234",
      guid: "p:0/fake-guid-1234",
      text: "Hello from iMessage!",
      sender: "+11234567890",
      chatGuid: "iMessage;-;+11234567890",
      dateCreated: 1700000000000,
      isFromMe: false,
      hasAttachments: false,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "GUID" },
      { key: "text", label: "Text" },
      { key: "sender", label: "Sender" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "dateCreated", label: "Date Created", type: "integer" },
      { key: "isFromMe", label: "Is From Me", type: "boolean" },
      { key: "hasAttachments", label: "Has Attachments", type: "boolean" },
    ],
  },
});
