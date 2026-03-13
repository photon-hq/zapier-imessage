import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { requireInboundMessage } from "./inboundCheck.js";

const inputFields = defineInputFields([
  {
    key: "chatGuid",
    label: "Chat",
    type: "string",
    required: true,
    helpText:
      "Phone number, email, or group chat ID. Usually mapped from a trigger step (e.g. +1234567890 or a Chat GUID).",
  },
  {
    key: "title",
    label: "Question",
    type: "string",
    required: false,
    helpText: "The poll question, e.g. \"Where should we eat?\" Leave blank for an untitled poll.",
  },
  {
    key: "options",
    label: "Choices",
    type: "string",
    required: true,
    helpText:
      "The answer choices, separated by commas. At least 2 required. E.g. Pizza, Sushi, Tacos",
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const options = bundle.inputData.options
    .split(",")
    .map((o: string) => o.trim())
    .filter((o: string) => o.length > 0);

  if (options.length < 2) {
    throw new z.errors.Error(
      "A poll requires at least 2 options. Please provide comma-separated options, e.g. 'Yes, No'.",
      "ValidationError",
      400,
    );
  }

  const tooShort = options.filter((o: string) => o.length < 2);
  if (tooShort.length > 0) {
    throw new z.errors.Error(
      `Each poll option must be at least 2 characters. These are too short: ${tooShort.map((o: string) => `"${o}"`).join(", ")}`,
      "ValidationError",
      400,
    );
  }

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

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || `poll-${Date.now()}`, ...data };
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
      id: "p:0/fake-poll-guid",
      guid: "p:0/fake-poll-guid",
      text: "What should we do?",
      ballotItems: ["Option A", "Option B", "Option C"],
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "guid", label: "Poll ID" },
      { key: "text", label: "Question" },
    ],
  },
});
