import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat GUID",
    type: "string",
    required: true,
    helpText:
      "e.g. iMessage;-;+1234567890 for a DM or iMessage;+;chat123 for a group",
  },
  {
    key: "title",
    label: "Poll Question",
    type: "string",
    required: false,
    helpText: "The poll title/question (optional).",
  },
  {
    key: "options",
    label: "Poll Options",
    type: "string",
    required: true,
    helpText:
      "Comma-separated list of options, e.g. Option A, Option B, Option C",
  },
]);

const perform = (async (z, bundle) => {
  const options = bundle.inputData.options
    .split(",")
    .map((o: string) => o.trim())
    .filter(Boolean);

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/poll/create`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      title: bundle.inputData.title || undefined,
      options,
    },
  });

  return response.data;
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "create_poll",
  noun: "Poll",

  display: {
    label: "Create Poll",
    description: "Create an interactive poll in an iMessage chat.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      guid: "p:0/fake-poll-guid",
      text: "What should we do?",
      ballotItems: ["Option A", "Option B", "Option C"],
    },
  },
});
