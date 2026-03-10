import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "address",
    label: "Phone Number or Email",
    type: "string",
    required: true,
    helpText: "The phone number or email to check, e.g. +1234567890",
  },
]);

const perform = (async (z, bundle) => {
  const response = await z.request<{ available: boolean }>({
    url: `${bundle.authData.serverUrl}/api/v1/handle/availability/imessage`,
    method: "GET",
    params: { address: bundle.inputData.address },
  });

  const available = response.data?.available ?? false;

  return [
    {
      id: bundle.inputData.address,
      address: bundle.inputData.address,
      iMessageAvailable: available,
      suggestedChatGuid: available
        ? `iMessage;-;${bundle.inputData.address}`
        : `SMS;-;${bundle.inputData.address}`,
    },
  ];
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "check_imessage",
  noun: "iMessage Availability",

  display: {
    label: "Check iMessage Availability",
    description:
      "Check if a phone number or email supports iMessage.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "+11234567890",
      address: "+11234567890",
      iMessageAvailable: true,
      suggestedChatGuid: "iMessage;-;+11234567890",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "address", label: "Address" },
      { key: "iMessageAvailable", label: "iMessage Available", type: "boolean" },
      { key: "suggestedChatGuid", label: "Suggested Chat GUID" },
    ],
  },
});
