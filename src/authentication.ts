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
  test: async (z: any, bundle: any) => {
    const serverUrl = bundle.authData.serverUrl as string;

    if (!/^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(serverUrl)) {
      throw new z.errors.Error(
        "Server URL must be a valid HTTPS URL (e.g. https://abc.example.com).",
      );
    }

    const response = await z.request({
      url: `${serverUrl}/api/v1/server/info`,
      method: "GET",
    });
    return response.data;
  },
  connectionLabel: "{{bundle.authData.serverUrl}}",
} satisfies Authentication;
