import type {
  Authentication,
  BeforeRequestMiddleware,
} from "zapier-platform-core";

export const addApiKeyToHeader: BeforeRequestMiddleware = (
  request,
  _z,
  bundle,
) => {
  const serverUrl = (bundle.authData.serverUrl as string || "").replace(/\/+$/, "");

  if (request.url) {
    request.url = request.url.replace(bundle.authData.serverUrl as string, serverUrl);
  }

  request.headers = {
    ...request.headers,
    "X-API-Key": bundle.authData.apiKey as string,
  };
  return request;
};

export default {
  type: "custom",
  fields: [
    {
      key: "serverUrl",
      label: "Server URL",
      type: "string",
      required: true,
      helpText:
        "Your Photon iMessage server URL, e.g. `https://abc.example.com`",
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
  ],
  test: {
    url: "{{bundle.authData.serverUrl}}/api/v1/server/info",
    method: "GET",
  },
  connectionLabel: "{{bundle.authData.serverUrl}}",
} satisfies Authentication;
