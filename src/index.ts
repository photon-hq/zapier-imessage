import {
  defineApp,
  version as platformVersion,
} from "zapier-platform-core";
import type { AfterResponseMiddleware } from "zapier-platform-core";
import packageJson from "../package.json" with { type: "json" };

import authentication, { addApiKeyToHeader } from "./authentication.js";
import newMessage from "./triggers/newMessage.js";
import listChats from "./triggers/listChats.js";
import sendMessage from "./creates/sendMessage.js";
import scheduleMessage from "./creates/scheduleMessage.js";
import reactMessage from "./creates/reactMessage.js";
import unsendMessage from "./creates/unsendMessage.js";
import editMessage from "./creates/editMessage.js";
import sendAttachment from "./creates/sendAttachment.js";
import sendSticker from "./creates/sendSticker.js";
import createGroupChat from "./creates/createGroupChat.js";
import addParticipant from "./creates/addParticipant.js";
import removeParticipant from "./creates/removeParticipant.js";
import renameGroupChat from "./creates/renameGroupChat.js";
import deleteChat from "./creates/deleteChat.js";
import markChatRead from "./creates/markChatRead.js";
import startTyping from "./creates/startTyping.js";
import createPoll from "./creates/createPoll.js";
import votePoll from "./creates/votePoll.js";
import shareContactCard from "./creates/shareContactCard.js";
import setChatBackground from "./creates/setChatBackground.js";
import setGroupIcon from "./creates/setGroupIcon.js";
import findMessages from "./searches/findMessages.js";
import getChats from "./searches/getChats.js";
import getChatParticipants from "./searches/getChatParticipants.js";
import getContacts from "./searches/getContacts.js";
import checkImessage from "./searches/checkImessage.js";
import getServerInfo from "./searches/getServerInfo.js";
import getMessageStats from "./searches/getMessageStats.js";
import findMyFriends from "./searches/findMyFriends.js";

const handleErrors: AfterResponseMiddleware = (response, z) => {
  if (response.status >= 400) {
    // Produce a readable body even when response.data is undefined (e.g. the
    // server returned an empty body or non-JSON for a 4xx response).
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
    [newMessage.key]: newMessage,
    [listChats.key]: listChats,
  },

  creates: {
    [sendMessage.key]: sendMessage,
    [scheduleMessage.key]: scheduleMessage,
    [reactMessage.key]: reactMessage,
    [unsendMessage.key]: unsendMessage,
    [editMessage.key]: editMessage,
    [sendAttachment.key]: sendAttachment,
    [sendSticker.key]: sendSticker,
    [createGroupChat.key]: createGroupChat,
    [addParticipant.key]: addParticipant,
    [removeParticipant.key]: removeParticipant,
    [renameGroupChat.key]: renameGroupChat,
    [deleteChat.key]: deleteChat,
    [markChatRead.key]: markChatRead,
    [startTyping.key]: startTyping,
    [createPoll.key]: createPoll,
    [votePoll.key]: votePoll,
    [shareContactCard.key]: shareContactCard,
    [setChatBackground.key]: setChatBackground,
    [setGroupIcon.key]: setGroupIcon,
  },

  searches: {
    [findMessages.key]: findMessages,
    [getChats.key]: getChats,
    [getChatParticipants.key]: getChatParticipants,
    [getContacts.key]: getContacts,
    [checkImessage.key]: checkImessage,
    [getServerInfo.key]: getServerInfo,
    [getMessageStats.key]: getMessageStats,
    [findMyFriends.key]: findMyFriends,
  },
});
