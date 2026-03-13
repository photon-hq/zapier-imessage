import type { ZObject, Bundle } from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

const POLICY_ERROR =
  "Photon Inbound-First Policy: No inbound message found for this chat. " +
  "You can only send to conversations where you have received at least one " +
  "message first. This protects your server from being flagged or banned. " +
  "Contact the Photon team if you need special access for outbound-first messaging.";

/**
 * Extracts the address portion from a chatGuid like "iMessage;-;+1234" or
 * "any;-;+1234" and returns alternate GUIDs with different service prefixes
 * so we can match regardless of which prefix the server uses.
 */
function chatGuidVariants(chatGuid: string): string[] {
  const parts = chatGuid.split(";");
  if (parts.length !== 3) return [chatGuid];

  const [_service, separator, address] = parts;
  const prefixes = ["any", "iMessage", "SMS"];
  const variants = prefixes.map((p) => `${p};${separator};${address}`);
  if (!variants.includes(chatGuid)) variants.unshift(chatGuid);
  return [...new Set(variants)];
}

/**
 * Queries messages for a chatGuid, trying alternate GUID prefixes if the
 * first attempt returns no results or a 404.
 */
async function queryMessagesForChat(
  z: ZObject,
  serverUrl: string,
  chatGuid: string,
  limit = 50,
): Promise<Array<{ isFromMe: boolean; is_from_me?: number }>> {
  const guids = chatGuidVariants(chatGuid);

  for (const guid of guids) {
    const response = await z.request<{
      data?: Array<{ isFromMe: boolean; is_from_me?: number }>;
    }>({
      url: `${serverUrl}/api/v1/message/query`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { chatGuid: guid, limit, sort: "DESC" },
      skipThrowForStatus: true,
    });

    if (response.status >= 400) continue;

    const messages = response.data?.data ?? [];
    if (messages.length > 0) return messages;
  }

  return [];
}

/**
 * Checks whether the chat exists on the server at all (present in the chat
 * list). If the chat is there, the user has a real conversation.
 */
async function chatExistsOnServer(
  z: ZObject,
  serverUrl: string,
  chatGuid: string,
): Promise<boolean> {
  const guids = chatGuidVariants(chatGuid);

  // Extract the address/identifier to match against chatIdentifier too
  const parts = chatGuid.split(";");
  const address = parts.length === 3 ? parts[2] : null;

  const response = await z.request<{
    data?: Array<{ guid: string; chatIdentifier?: string }>;
  }>({
    url: `${serverUrl}/api/v1/chat/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { limit: 100, offset: 0, sort: "lastmessage" },
    skipThrowForStatus: true,
  });

  if (response.status >= 400) return false;

  const chats = response.data?.data ?? [];
  return chats.some(
    (chat) =>
      guids.includes(chat.guid) ||
      (address && chat.chatIdentifier === address),
  );
}

function hasInboundMessage(
  messages: Array<{ isFromMe: boolean; is_from_me?: number }>,
): boolean {
  return messages.some((m) => m.isFromMe === false || m.is_from_me === 0);
}

/**
 * Checks that at least one inbound (not from me) message exists in the given
 * chat, OR that the chat exists on the server (meaning it's a real
 * conversation). Throws a user-friendly error only if neither condition is met.
 */
export async function requireInboundMessage(
  z: ZObject,
  bundle: Bundle,
  chatGuid: string,
): Promise<void> {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);

  const messages = await queryMessagesForChat(z, serverUrl, chatGuid);
  if (hasInboundMessage(messages)) return;

  // Fallback: if the chat exists on the server at all, allow it.
  // The user picked it from the dropdown or has a real conversation there.
  if (await chatExistsOnServer(z, serverUrl, chatGuid)) return;

  throw new z.errors.Error(POLICY_ERROR, "InboundFirstPolicy");
}

/**
 * For createGroupChat: checks that at least one of the provided addresses
 * has an existing chat with inbound messages or exists on the server.
 */
export async function requireInboundForAddresses(
  z: ZObject,
  bundle: Bundle,
  addresses: string[],
): Promise<void> {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);

  for (const address of addresses) {
    const guids = chatGuidVariants(`iMessage;-;${address}`);

    for (const guid of guids) {
      const messages = await queryMessagesForChat(z, serverUrl, guid, 5);
      if (hasInboundMessage(messages)) return;
    }

    if (await chatExistsOnServer(z, serverUrl, `iMessage;-;${address}`))
      return;
  }

  throw new z.errors.Error(
    "Photon Inbound-First Policy: None of the provided addresses have inbound " +
      "message history. You can only create group chats with contacts who have " +
      "messaged you first. Contact the Photon team for special access.",
    "InboundFirstPolicy",
  );
}
