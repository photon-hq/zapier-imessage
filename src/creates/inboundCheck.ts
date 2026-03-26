import type { ZObject, Bundle } from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

/**
 * Normalizes a user-supplied chat identifier into a proper chatGuid.
 * - Plain phone/email → `iMessage;-;<address>`
 * - `any;-;<address>` → `iMessage;-;<address>` (avoids server picking a group)
 * - Already-qualified GUIDs (iMessage;-;, SMS;-;, iMessage;+;) pass through.
 */
export function normalizeChatGuid(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return trimmed;

  if (!trimmed.includes(";")) {
    return `iMessage;-;${trimmed}`;
  }

  if (trimmed.startsWith("any;-;")) {
    return `iMessage;-;${trimmed.slice(6)}`;
  }

  return trimmed;
}

const POLICY_ERROR =
  "Photon Inbound-First Policy: No prior conversation found for this chat. " +
  "You can only send to conversations that already exist on your server. " +
  "Contact the Photon team if you need special access for outbound-first messaging.";

function isRawAddress(input: string): boolean {
  return !input.includes(";");
}

function chatGuidVariants(chatGuid: string): string[] {
  let address: string;
  let separator = "-";

  if (isRawAddress(chatGuid)) {
    address = chatGuid;
  } else {
    const parts = chatGuid.split(";");
    if (parts.length !== 3) return [chatGuid];
    separator = parts[1]!;
    address = parts[2]!;
  }

  const prefixes = ["iMessage", "any", "SMS"];
  const variants = prefixes.map((p) => `${p};${separator};${address}`);
  if (!isRawAddress(chatGuid) && !variants.includes(chatGuid)) {
    variants.unshift(chatGuid);
  }
  return [...new Set(variants)];
}

/**
 * Checks if ANY messages exist for this chat (inbound or outbound).
 * If messages exist, the conversation is real.
 */
async function hasAnyMessages(
  z: ZObject,
  serverUrl: string,
  chatGuid: string,
): Promise<boolean> {
  const guids = chatGuidVariants(chatGuid);

  for (const guid of guids) {
    const response = await z.request<{
      data?: Array<Record<string, unknown>>;
    }>({
      url: `${serverUrl}/api/v1/message/query`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { chatGuid: guid, limit: 1, sort: "DESC" },
      skipThrowForStatus: true,
    });

    if (response.status >= 400) continue;
    if ((response.data?.data ?? []).length > 0) return true;
  }

  return false;
}

/**
 * Checks whether the chat exists in the server's chat list. Also matches
 * raw addresses (phone numbers / emails) against chatIdentifier.
 */
async function chatExistsOnServer(
  z: ZObject,
  serverUrl: string,
  chatGuid: string,
): Promise<boolean> {
  const guids = chatGuidVariants(chatGuid);
  const rawAddr = isRawAddress(chatGuid) ? chatGuid : chatGuid.split(";")[2];

  const response = await z.request<{
    data?: Array<{ guid: string; chatIdentifier?: string }>;
  }>({
    url: `${serverUrl}/api/v1/chat/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { limit: 200, offset: 0, sort: "lastmessage" },
    skipThrowForStatus: true,
  });

  if (response.status >= 400) return false;

  const chats = response.data?.data ?? [];
  return chats.some(
    (chat) =>
      guids.includes(chat.guid) ||
      (rawAddr && chat.chatIdentifier === rawAddr),
  );
}

export async function requireInboundMessage(
  z: ZObject,
  bundle: Bundle,
  chatGuid: string,
): Promise<void> {
  if (chatGuid.includes(";+;")) return;

  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  if (await hasAnyMessages(z, serverUrl, chatGuid)) return;
  if (await chatExistsOnServer(z, serverUrl, chatGuid)) return;
  throw new z.errors.Error(POLICY_ERROR, "InboundFirstPolicy");
}

/**
 * Inbound-first policy disabled for createGroupChat: allow all addresses.
 */
export async function requireInboundForAddresses(
  _z: ZObject,
  _bundle: Bundle,
  _addresses: string[],
): Promise<void> {
  return;
  // const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);
  // for (const address of addresses) {
  //   if (await hasAnyMessages(z, serverUrl, address)) return;
  //   if (await chatExistsOnServer(z, serverUrl, address)) return;
  // }
  // throw new z.errors.Error("...", "InboundFirstPolicy");
}
