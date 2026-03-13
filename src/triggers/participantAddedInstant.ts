import {
  defineTrigger,
  type WebhookTriggerPerformList,
} from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";
import { normalizeUrl } from "../authentication.js";

const performList = (async (z: ZObject, bundle: Bundle) => {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const listRes = await z.request({
    url: `${serverUrl}/api/v1/chat/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { limit: 10, offset: 0, sort: "lastmessage", with: [] },
  });
  const raw = listRes.data as { data?: Array<{ guid: string; style: number }> } | Array<{ guid: string; style: number }>;
  const chats = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const groupChats = chats.filter((c) => c.style === 43);
  const out: Array<{ id: string; chatGuid: string; participant: string }> = [];
  for (const chat of groupChats.slice(0, 5)) {
    try {
      const partRes = await z.request<{
        participants?: Array<{ address: string }>;
      }>({
        url: `${serverUrl}/api/v1/chat/${encodeURIComponent(chat.guid)}`,
        method: "GET",
        params: { with: "participants" },
      });
      const participants = (partRes.data as { participants?: Array<{ address: string }> })?.participants ?? [];
      for (const p of participants) {
        out.push({
          id: `padd-${chat.guid}-${p.address}`,
          chatGuid: chat.guid,
          participant: p.address,
        });
      }
    } catch {
      // Skip chat if participants fetch fails
    }
  }
  return out;
}) satisfies WebhookTriggerPerformList;

const perform = makePerform("participant-added", (data) => ({
  id: `padd-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  participant:
    (data.handle as Record<string, unknown>)?.address ?? data.participant,
}));

export default defineTrigger({
  key: "participant_added_instant",
  noun: "Participant",

  display: {
    label: "Participant Added",
    description:
      "Triggers when a participant is added to a group chat on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "padd-iMessage;+;sample-chat-1700000000000",
      chatGuid: "iMessage;+;sample-chat",
      participant: "+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Group Chat" },
      { key: "participant", label: "Participant" },
    ],
  },
});
