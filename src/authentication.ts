import type {
  Authentication,
  BeforeRequestMiddleware,
  ZObject,
  Bundle,
} from "zapier-platform-core";

/**
 * Strips any trailing slashes from a URL and collapses double slashes in the
 * path portion.  This is applied both in the beforeRequest middleware (for all
 * requests) and explicitly inside the auth test perform function (to guard
 * against the Zapier hosted-platform behaviour where the {{curlies}} template
 * is resolved by the backend *before* the app's beforeRequest chain runs,
 * meaning our middleware never gets a chance to normalise the URL).
 */
export const normalizeUrl = (url: string): string =>
  (url || "")
    // Strip trailing slashes from the whole URL first
    .replace(/\/+$/, "")
    // Collapse any double (or more) slashes in the path, but leave the
    // protocol double-slash (https://) intact
    .replace(/(https?:\/\/)\/+/g, "$1")
    .replace(/([^:])\/\/+/g, "$1/");

export const addApiKeyToHeader: BeforeRequestMiddleware = (
  request,
  _z,
  bundle,
) => {
  if (request.url) {
    request.url = normalizeUrl(request.url);
  }

  request.headers = {
    ...request.headers,
    "X-API-Key": bundle.authData.apiKey as string,
  };
  return request;
};

export const WEBHOOK_BRIDGE_URL = "https://webhooks.photon.codes";

/**
 * Credentials flow: user enters Endpoint (server URL) + API Key. When they use
 * a trigger and turn the Zap on, we take these plus Zapier's webhook URL (the
 * endpoint that receives events), POST to webhooks.photon.codes, get the
 * signing secret back, and use it to verify incoming webhooks. All in the background.
 */
const authTest = async (z: ZObject, bundle: Bundle) => {
  const baseUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const bridgeUrl = normalizeUrl(
    (bundle.authData.webhookBridgeUrl as string) || WEBHOOK_BRIDGE_URL,
  );

  const serverResponse = await z.request({
    url: `${baseUrl}/api/v1/server/info`,
    method: "GET",
    skipThrowForStatus: true,
  });

  if (serverResponse.status === 401 || serverResponse.status === 403) {
    throw new z.errors.Error(
      "Authentication failed: invalid API key.",
      "AuthenticationError",
      serverResponse.status,
    );
  }

  if (serverResponse.status === 404) {
    throw new z.errors.Error(
      `Could not reach the Photon server at "${baseUrl}". Check that the Server URL is correct and the server is running.`,
      "NotFoundError",
      serverResponse.status,
    );
  }

  if (serverResponse.status >= 400) {
    throw new z.errors.Error(
      `Server returned an unexpected error (HTTP ${serverResponse.status}). Verify your Server URL and API Key.`,
      "ApiError",
      serverResponse.status,
    );
  }

  const apiKey = bundle.authData.apiKey as string;
  const testWebhookUrl = "https://zapier-connection-test.invalid";
  const bridgeSubscribe = await z.request({
    url: `${bridgeUrl}/api/webhooks`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      serverUrl: baseUrl,
      apiKey,
      webhookUrl: testWebhookUrl,
    },
    skipThrowForStatus: true,
  });

  if (bridgeSubscribe.status >= 200 && bridgeSubscribe.status < 300) {
    const data = bridgeSubscribe.data as { id?: string };
    if (data?.id) {
      await z.request({
        url: `${bridgeUrl}/api/webhooks/${data.id}`,
        method: "DELETE",
        skipThrowForStatus: true,
      });
    }
  } else if (bridgeSubscribe.status === 404) {
    throw new z.errors.Error(
      `Webhook Bridge at "${bridgeUrl}" does not expose POST /api/webhooks. ` +
        "Use a bridge that supports programmatic webhook registration (e.g. github.com/photon-hq/webhook).",
      "NotFoundError",
      404,
    );
  } else if (bridgeSubscribe.status === 401 || bridgeSubscribe.status === 403) {
    throw new z.errors.Error(
      "Webhook Bridge rejected the request. Check that your Server URL and API Key are correct.",
      "AuthenticationError",
      bridgeSubscribe.status,
    );
  } else if (bridgeSubscribe.status >= 400) {
    const msg =
      (bridgeSubscribe.data as { message?: string })?.message ||
      `Bridge returned HTTP ${bridgeSubscribe.status}.`;
    throw new z.errors.Error(
      `Webhook Bridge error: ${msg} Ensure the bridge URL and your credentials are correct.`,
      "ApiError",
      bridgeSubscribe.status,
    );
  }

  return {
    ...(typeof serverResponse.data === "object" && serverResponse.data !== null
      ? serverResponse.data
      : {}),
    serverUrl: baseUrl,
    webhookBridgeUrl: bridgeUrl,
  };
};

const authentication: Authentication = {
  type: "custom",
  fields: [
    {
      key: "serverUrl",
      label: "Endpoint",
      type: "string",
      required: true,
      default: "https://example.imsgd.photon.codes",
      helpText:
        "Your Photon iMessage server URL. We use this plus your API key to register with webhooks.photon.codes so events can reach your Zaps.",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      computed: false,
      helpText:
        "API key for the endpoint above. When you turn on a Zap, we send this and Zapier's webhook URL to webhooks.photon.codes and get a signing secret to verify deliveries.",
    },
  ],
  // Use a function perform so we control URL normalisation and error messages.
  test: authTest,
  connectionLabel: "{{bundle.authData.serverUrl}}",
};

export default authentication;
