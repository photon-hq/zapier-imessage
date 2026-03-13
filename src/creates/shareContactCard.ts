import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat GUID",
    type: "string",
    required: true,
    helpText:
      "e.g. iMessage;-;+1234567890 for a DM or iMessage;+;chat123 for a group",
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/contact/share`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "share_contact_card",
  noun: "Contact Card",

  display: {
    label: "Share Contact Card",
    description:
      'Share your contact card ("Name and Photo") in an iMessage chat.',
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "contact-card-1234",
      status: 200,
      message: "Contact card shared successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
