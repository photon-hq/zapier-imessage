import type { ZObject, Bundle } from "zapier-platform-core";
import { normalizeUrl } from "../authentication.js";

const POLICY_ERROR =
  "Photon Inbound-First Policy: No inbound message found for this chat. " +
  "You can only send to conversations where you have received at least one " +
  "message first. This protects your server from being flagged or banned. " +
  "Contact the Photon team if you need special access for outbound-first messaging.";

/**
 * Checks that at least one inbound (not from me) message exists in the given
 * chat before allowing an outbound action.  Throws a user-friendly error if
 * the chat has no inbound history.
 */
export async function requireInboundMessage(
  z: ZObject,
  bundle: Bundle,
  chatGuid: string,
): Promise<void> {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);

  const response = await z.request<{
    data?: Array<{ isFromMe: boolean }>;
  }>({
    url: `${serverUrl}/api/v1/message/query`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid,
      limit: 1,
      where: [{ statement: "message.is_from_me = :value", args: { value: 0 } }],
    },
    skipThrowForStatus: true,
  });

  if (response.status >= 400) {
    // Fallback: if the query endpoint doesn't support the where clause, try
    // fetching recent messages and checking manually.
    const fallback = await z.request<{
      data?: Array<{ isFromMe: boolean; is_from_me?: number }>;
    }>({
      url: `${serverUrl}/api/v1/message/query`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { chatGuid, limit: 50, sort: "DESC" },
    });

    const messages = fallback.data?.data ?? [];
    const hasInbound = messages.some(
      (m) => m.isFromMe === false || m.is_from_me === 0,
    );

    if (!hasInbound) {
      throw new z.errors.Error(POLICY_ERROR, "InboundFirstPolicy");
    }
    return;
  }

  const messages = response.data?.data ?? [];
  if (messages.length === 0) {
    throw new z.errors.Error(POLICY_ERROR, "InboundFirstPolicy");
  }
}

/**
 * For createGroupChat: checks that at least one of the provided addresses
 * has an existing chat with inbound messages.
 */
export async function requireInboundForAddresses(
  z: ZObject,
  bundle: Bundle,
  addresses: string[],
): Promise<void> {
  const serverUrl = normalizeUrl(bundle.authData.serverUrl as string);

  for (const address of addresses) {
    const chatGuid = `iMessage;-;${address}`;
    const response = await z.request<{
      data?: Array<{ isFromMe: boolean; is_from_me?: number }>;
    }>({
      url: `${serverUrl}/api/v1/message/query`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { chatGuid, limit: 5, sort: "DESC" },
      skipThrowForStatus: true,
    });

    const messages = response.data?.data ?? [];
    const hasInbound = messages.some(
      (m) => m.isFromMe === false || m.is_from_me === 0,
    );

    if (hasInbound) return;
  }

  throw new z.errors.Error(
    "Photon Inbound-First Policy: None of the provided addresses have inbound " +
      "message history. You can only create group chats with contacts who have " +
      "messaged you first. Contact the Photon team for special access.",
    "InboundFirstPolicy",
  );
}
