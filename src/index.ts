import {
  defineApp,
  version as platformVersion,
} from "zapier-platform-core";
import type { AfterResponseMiddleware } from "zapier-platform-core";
import packageJson from "../package.json" with { type: "json" };

import authentication, { addApiKeyToHeader } from "./authentication.js";
import newMessage from "./triggers/newMessage.js";
import sendMessage from "./creates/sendMessage.js";
import scheduleMessage from "./creates/scheduleMessage.js";
import reactMessage from "./creates/reactMessage.js";
import findMessages from "./searches/findMessages.js";

const handleErrors: AfterResponseMiddleware = (response, z) => {
  if (response.status >= 400) {
    const body =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
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

  authentication,

  beforeRequest: [addApiKeyToHeader],
  afterResponse: [handleErrors],

  triggers: {
    [newMessage.key]: newMessage,
  },

  creates: {
    [sendMessage.key]: sendMessage,
    [scheduleMessage.key]: scheduleMessage,
    [reactMessage.key]: reactMessage,
  },

  searches: {
    [findMessages.key]: findMessages,
  },
});
