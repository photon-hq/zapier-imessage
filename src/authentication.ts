import type {
  Authentication,
  BeforeRequestMiddleware,
} from "zapier-platform-core";

export const addApiKeyToHeader: BeforeRequestMiddleware = (
  request,
  _z,
  bundle,
) => {
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
        "Your Photon iMessage server URL, e.g. https://abc.example.com",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      computed: false,
    },
  ],
  test: {
    url: "{{bundle.authData.serverUrl}}/api/v1/server/info",
    method: "GET",
  },
  connectionLabel: "{{bundle.authData.serverUrl}}",
} satisfies Authentication;
