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

/**
 * Custom auth test perform function.
 *
 * Using a shorthand `test: { url: "{{bundle.authData.serverUrl}}/..." }` is
 * unreliable on Zapier's hosted platform because:
 *
 *  1. The `{{curlies}}` template is resolved by Zapier's backend *before* the
 *     app's `beforeRequest` middleware runs, so a trailing slash in `serverUrl`
 *     produces a double-slash URL that the server returns 404 for — and our
 *     middleware never sees the raw template to fix it.
 *
 *  2. The `afterResponse` `handleErrors` middleware throws a `z.errors.Error`
 *     for any 4xx response *before* Zapier can inspect the response itself,
 *     so Zapier surfaces the thrown message verbatim as the auth failure reason
 *     rather than a clean "invalid credentials" message.
 *
 * A custom `perform` function sidesteps both problems: we normalise the URL
 * ourselves before calling `z.request`, and we let Zapier's own
 * `throwForStatus` handle the 4xx case (by not throwing in afterResponse for
 * the auth test path — see the `skipThrowForStatus` flag below).
 */
const authTest = async (z: ZObject, bundle: Bundle) => {
  const baseUrl = normalizeUrl(bundle.authData.serverUrl as string);
  const response = await z.request({
    url: `${baseUrl}/api/v1/server/info`,
    method: "GET",
    // Tell the Zapier platform NOT to throw automatically on 4xx/5xx so that
    // we can return a clean, user-friendly error message ourselves.
    skipThrowForStatus: true,
  });

  if (response.status === 401 || response.status === 403) {
    throw new z.errors.Error(
      "Authentication failed: invalid API key.",
      "AuthenticationError",
      response.status,
    );
  }

  if (response.status === 404) {
    throw new z.errors.Error(
      `Could not reach the Photon server at "${baseUrl}". ` +
        "Please check that the Server URL is correct and the server is running.",
      "NotFoundError",
      response.status,
    );
  }

  if (response.status >= 400) {
    throw new z.errors.Error(
      `Server returned an unexpected error (HTTP ${response.status}). ` +
        "Please verify your Server URL and API Key.",
      "ApiError",
      response.status,
    );
  }

  return response.data;
};

const authentication: Authentication = {
  type: "custom",
  fields: [
    {
      key: "serverUrl",
      label: "Server URL",
      type: "string",
      required: true,
      helpText:
        "Your Photon iMessage server URL, e.g. `https://abc.example.com` " +
        "(trailing slashes are handled automatically).",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      computed: false,
      helpText:
        "Go to your [Photon iMessage Server Dashboard](https://docs.photon.sh) to find your API Key.",
    },
    {
      key: "webhookBridgeUrl",
      label: "Webhook Bridge URL",
      type: "string",
      required: true,
      helpText:
        "URL of your Photon Webhook Bridge, e.g. `https://webhook.photon.codes`.",
    },
  ],
  // Use a function perform so we control URL normalisation and error messages.
  test: authTest,
  connectionLabel: "{{bundle.authData.serverUrl}}",
};

export default authentication;
