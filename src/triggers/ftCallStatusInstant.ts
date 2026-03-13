import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "ftcall-iMessage;-;+11234567890-1700000000000",
    chatGuid: "iMessage;-;+11234567890",
    status: "ringing",
    caller: "+11234567890",
  },
];

const perform = makePerform("ft-call-status-changed", (data) => ({
  id: `ftcall-${data.chatGuid || data.guid}-${Date.now()}`,
  chatGuid: data.chatGuid ?? data.guid,
  status: data.status,
  caller: (data.handle as Record<string, unknown>)?.address ?? data.caller,
}));

export default defineTrigger({
  key: "ft_call_status_instant",
  noun: "FaceTime Call",

  display: {
    label: "FaceTime Call Status Changed",
    description:
      "Triggers when a FaceTime call status changes on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "ftcall-iMessage;-;+11234567890-1700000000000",
      chatGuid: "iMessage;-;+11234567890",
      status: "ringing",
      caller: "+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "chatGuid", label: "Chat" },
      { key: "status", label: "Status" },
      { key: "caller", label: "Caller" },
    ],
  },
});
