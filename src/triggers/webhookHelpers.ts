/**
 * Webhook trigger lifecycle for https://webhook.photon.codes
 *
 * The bridge at webhook.photon.codes is a web form (no programmatic API).
 * The user configures the webhook manually there and pastes the Signing
 * Secret into their Zapier connection. Therefore:
 *
 * - subscribe/unsubscribe are no-ops (webhook already configured via the form)
 * - Signature verification uses authData.signingSecret from the connection
 *
 * Incoming webhooks: Bridge POSTs to Zapier with body { event, data },
 * headers X-Photon-Signature (v0=<hmac-hex>), X-Photon-Timestamp (unix sec).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ZObject,
  Bundle,
  WebhookTriggerPerformSubscribe,
  WebhookTriggerPerformUnsubscribe,
} from "zapier-platform-core";

const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

/**
 * Verifies the HMAC-SHA256 signature on an incoming webhook payload.
 * Signature format: v0=<hex>
 * Signed base string: v0:<timestamp>:<rawBody>
 */
export function verifySignature(
  rawBody: string,
  signingSecret: string | undefined,
  signature: string | undefined,
  timestamp: string | undefined,
): boolean {
  if (!signingSecret) return false;
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > MAX_TIMESTAMP_DRIFT_SECONDS) return false;

  const sigBase = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac("sha256", signingSecret).update(sigBase).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * The bridge (webhook.photon.codes) is a web form — no programmatic API.
 * We store the Zapier webhook URL in subscribeData so the user can find it
 * if needed. The user must have already configured the webhook at the bridge
 * and pasted the Signing Secret into their connection for events to flow.
 */
export const subscribe = (async (z: ZObject, bundle: Bundle) => {
  const signingSecret = (bundle.authData.signingSecret as string)?.trim();
  if (!signingSecret) {
    throw new z.errors.Error(
      `Before turning on this Zap, go to https://webhook.photon.codes and add a webhook with your Server URL, API Key, and this Webhook URL: ${bundle.targetUrl} — then paste the Signing Secret you receive into your connection settings and try again.`,
      "SetupRequired",
      400,
    );
  }
  return { id: "manual", webhookUrl: bundle.targetUrl };
}) satisfies WebhookTriggerPerformSubscribe;

/**
 * No-op: the webhook was configured manually, nothing to clean up via API.
 */
export const unsubscribe = (async (_z: ZObject, _bundle: Bundle) => {
  return {};
}) satisfies WebhookTriggerPerformUnsubscribe;

/**
 * Returns the signing secret from the connection (authData).
 */
export function getSigningSecret(bundle: Bundle): string {
  const auth = (bundle.authData ?? {}) as Record<string, unknown>;
  const secret = (auth.signingSecret as string)?.trim();
  if (!secret) {
    throw new Error("MissingSigningSecret");
  }
  return secret;
}

/**
 * Verifies the webhook signature from the bundle; throws on failure.
 */
export function assertValidSignature(z: ZObject, bundle: Bundle): void {
  const headers = (bundle.rawRequest?.headers ?? {}) as Record<string, string>;
  const rawBody = bundle.rawRequest?.content ?? "";
  let signingSecret: string;
  try {
    signingSecret = getSigningSecret(bundle);
  } catch {
    throw new z.errors.Error(
      "Signing Secret not found in your connection. Go to https://webhook.photon.codes, set up the webhook, and paste the Signing Secret into your connection settings.",
      "MissingSigningSecret",
      403,
    );
  }
  const sig =
    headers["x-photon-signature"] ?? headers["X-Photon-Signature"];
  const ts = headers["x-photon-timestamp"] ?? headers["X-Photon-Timestamp"];
  if (!verifySignature(rawBody, signingSecret, sig, ts)) {
    throw new z.errors.Error(
      "Invalid or missing webhook signature. Check that your Signing Secret matches the one shown at https://webhook.photon.codes.",
      "SignatureError",
      403,
    );
  }
}

/**
 * Creates a webhook perform function that verifies the HMAC-SHA256 signature,
 * filters for a specific event, and maps the payload using the provided
 * transform function.
 */
export function makePerform<T extends Record<string, unknown>>(
  eventName: string,
  transform: (data: Record<string, unknown>) => T,
) {
  return async (z: ZObject, bundle: Bundle): Promise<T[]> => {
    assertValidSignature(z, bundle);

    const payload = bundle.cleanedRequest as {
      event?: string;
      data?: Record<string, unknown>;
    };

    if (!payload?.data || payload.event !== eventName) {
      return [];
    }

    return [transform(payload.data)];
  };
}
