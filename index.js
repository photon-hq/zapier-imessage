'use strict';

const { version } = require('./package.json');
const { version: platformVersion } = require('zapier-platform-core');

const authentication = require('./authentication');
const newMessage = require('./triggers/newMessage');
const sendMessage = require('./creates/sendMessage');
const scheduleMessage = require('./creates/scheduleMessage');
const reactMessage = require('./creates/reactMessage');
const findMessages = require('./searches/findMessages');

const handleErrors = (response, z) => {
  if (response.status >= 400) {
    const body =
      typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    throw new z.errors.Error(
      `API returned ${response.status}: ${body}`,
      'ApiError',
      response.status
    );
  }
  return response;
};

module.exports = {
  version,
  platformVersion,

  authentication,

  beforeRequest: [...authentication.beforeRequest],

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
};
