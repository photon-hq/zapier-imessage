import { defineTrigger } from "zapier-platform-core";
import { subscribe, unsubscribe, assertValidSignature } from "./webhookHelpers.js";
import type { ZObject, Bundle } from "zapier-platform-core";

const SERVER_EVENTS = new Set([
  "new-server",
  "server-update",
  "server-update-downloading",
  "server-update-installing",
]);

const perform = async (z: ZObject, bundle: Bundle) => {
  assertValidSignature(z, bundle);

  const payload = bundle.cleanedRequest as {
    event?: string;
    data?: Record<string, unknown>;
  };

  if (!payload?.data || !payload.event || !SERVER_EVENTS.has(payload.event)) {
    return [];
  }

  const d = payload.data;
  return [
    {
      id: `srv-${payload.event}-${Date.now()}`,
      event: payload.event,
      version: d.version,
      name: d.name,
      status: d.status,
    },
  ];
};

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "srv-server-update-1700000000000",
    event: "server-update",
    version: "2.0.0",
    name: "Photon Server",
    status: "available",
  },
];

export default defineTrigger({
  key: "server_update_instant",
  noun: "Server Update",

  display: {
    label: "Server Update",
    description:
      "Triggers when your Photon server has an update, is downloading, or installing.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "srv-server-update-1700000000000",
      event: "server-update",
      version: "2.0.0",
      name: "Photon Server",
      status: "available",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "event", label: "Event Type" },
      { key: "version", label: "Version" },
      { key: "name", label: "Server Name" },
      { key: "status", label: "Status" },
    ],
  },
});
