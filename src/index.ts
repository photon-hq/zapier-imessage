import {
  defineApp,
  version as platformVersion,
} from "zapier-platform-core";
import type { AfterResponseMiddleware } from "zapier-platform-core";
import packageJson from "../package.json" with { type: "json" };

import authentication, { addApiKeyToHeader } from "./authentication.js";

// Webhook (instant) triggers – core set
import newMessageInstant from "./triggers/newMessageInstant.js";
import messageUpdatedInstant from "./triggers/messageUpdatedInstant.js";
import messageSendErrorInstant from "./triggers/messageSendErrorInstant.js";
import participantAddedInstant from "./triggers/participantAddedInstant.js";
import participantRemovedInstant from "./triggers/participantRemovedInstant.js";
import scheduledMessageInstant from "./triggers/scheduledMessageInstant.js";

// Creates – core set
import performAction from "./creates/performAction.js";
import sendMessage from "./creates/sendMessage.js";
import scheduleMessage from "./creates/scheduleMessage.js";
import sendAttachment from "./creates/sendAttachment.js";
import createGroupChat from "./creates/createGroupChat.js";
import addParticipant from "./creates/addParticipant.js";
import removeParticipant from "./creates/removeParticipant.js";
import reactMessage from "./creates/reactMessage.js";

// Searches – core set
import findMessages from "./searches/findMessages.js";
import getChats from "./searches/getChats.js";
import getChatParticipants from "./searches/getChatParticipants.js";
import getContacts from "./searches/getContacts.js";

const handleErrors: AfterResponseMiddleware = (response, z) => {
  if (response.status >= 400) {
    let body: string;
    if (typeof response.data === "string") {
      body = response.data || response.content || "(empty body)";
    } else if (response.data !== undefined && response.data !== null) {
      body = JSON.stringify(response.data);
    } else {
      body = response.content || "(empty body)";
    }
    throw new z.errors.Error(
      `API returned ${response.status}: ${body}`,
      "ApiError",
      response.status,
    );
  }
  return response;
};

export default defineApp({
  version: packageJson.version,
  platformVersion,

  flags: {
    cleanInputData: false,
  },

  authentication,

  beforeRequest: [addApiKeyToHeader],
  afterResponse: [handleErrors],

  triggers: {
    [newMessageInstant.key]: newMessageInstant,
    [messageUpdatedInstant.key]: messageUpdatedInstant,
    [messageSendErrorInstant.key]: messageSendErrorInstant,
    [participantAddedInstant.key]: participantAddedInstant,
    [participantRemovedInstant.key]: participantRemovedInstant,
    [scheduledMessageInstant.key]: scheduledMessageInstant,
  },

  creates: {
    [performAction.key]: performAction,
    [sendMessage.key]: sendMessage,
    [scheduleMessage.key]: scheduleMessage,
    [sendAttachment.key]: sendAttachment,
    [createGroupChat.key]: createGroupChat,
    [addParticipant.key]: addParticipant,
    [removeParticipant.key]: removeParticipant,
    [reactMessage.key]: reactMessage,
  },

  searches: {
    [findMessages.key]: findMessages,
    [getChats.key]: getChats,
    [getChatParticipants.key]: getChatParticipants,
    [getContacts.key]: getContacts,
  },
});
