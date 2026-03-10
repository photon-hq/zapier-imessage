import type {
  Authentication,
  BeforeRequestMiddleware,
} from "zapier-platform-core";

const normalizeUrl = (url: string): string =>
  (url || "").replace(/\/+$/, "");

export const addApiKeyToHeader: BeforeRequestMiddleware = (
  request,
  _z,
  bundle,
) => {
  if (request.url) {
    request.url = request.url.replace(/(https?:\/\/)\/*/g, "$1").replace(/([^:])\/+/g, "$1/");
  }

  request.headers = {
    ...request.headers,
    "X-API-Key": bundle.authData.apiKey as string,
  };
  return request;
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
};

export default authentication;
