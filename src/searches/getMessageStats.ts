import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "placeholder",
    label: "Fetch Message Stats",
    type: "string",
    required: false,
    default: "yes",
    helpText: "No input needed — this fetches your server's message statistics.",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request<Record<string, unknown>>({
    url: `${bundle.authData.serverUrl}/api/v1/server/statistics/messages`,
    method: "GET",
  });

  const stats = response.data;

  return [
    {
      id: "message-stats",
      total: stats.total,
      sent: stats.sent,
      received: stats.received,
      last24h: stats.last24h,
      last7d: stats.last7d,
      last30d: stats.last30d,
    },
  ];
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "get_message_stats",
  noun: "Message Statistics",

  display: {
    label: "Get Message Statistics",
    description: "Get message counts and analytics from your Photon server.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "message-stats",
      total: 12345,
      sent: 5000,
      received: 7345,
      last24h: 50,
      last7d: 300,
      last30d: 1000,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "total", label: "Total Messages", type: "integer" },
      { key: "sent", label: "Sent", type: "integer" },
      { key: "received", label: "Received", type: "integer" },
      { key: "last24h", label: "Last 24 Hours", type: "integer" },
      { key: "last7d", label: "Last 7 Days", type: "integer" },
      { key: "last30d", label: "Last 30 Days", type: "integer" },
    ],
  },
});
