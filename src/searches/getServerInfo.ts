import {
  defineSearch,
  type SearchPerform,
} from "zapier-platform-core";

const perform = (async (z, bundle) => {
  const response = await z.request<Record<string, unknown>>({
    url: `${bundle.authData.serverUrl}/api/v1/server/info`,
    method: "GET",
  });

  const info = response.data;

  return [
    {
      id: "server-info",
      osVersion: info.os_version,
      serverVersion: info.server_version,
      privateApi: info.private_api,
      helperConnected: info.helper_connected,
      detectedIcloud: info.detected_icloud,
    },
  ];
}) satisfies SearchPerform;

export default defineSearch({
  key: "get_server_info",
  noun: "Server Info",

  display: {
    label: "Get Server Info",
    description: "Get the status and configuration of your Photon server.",
  },

  operation: {
    perform,
    sample: {
      id: "server-info",
      osVersion: "14.0",
      serverVersion: "1.0.0",
      privateApi: true,
      helperConnected: true,
      detectedIcloud: "user@icloud.com",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "osVersion", label: "OS Version" },
      { key: "serverVersion", label: "Server Version" },
      { key: "privateApi", label: "Private API Enabled", type: "boolean" },
      { key: "helperConnected", label: "Helper Connected", type: "boolean" },
      { key: "detectedIcloud", label: "Detected iCloud Account" },
    ],
  },
});
