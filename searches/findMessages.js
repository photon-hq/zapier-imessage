'use strict';

const perform = async (z, bundle) => {
  const body = {
    where: [
      {
        statement: 'message.text LIKE :text',
        args: { text: `%${bundle.inputData.query}%` },
      },
    ],
    limit: bundle.inputData.limit || 5,
    sort: 'DESC',
  };

  if (bundle.inputData.chatGuid) {
    body.chatGuid = bundle.inputData.chatGuid;
  }

  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/query`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const messages = response.data?.data ?? response.data ?? [];

  return messages.map((msg) => ({
    id: msg.guid,
    guid: msg.guid,
    text: msg.text,
    sender: msg.handle?.address,
    chatGuid: msg.chats?.[0],
    dateCreated: msg.dateCreated,
  }));
};

module.exports = {
  key: 'find_messages',
  noun: 'Message',
  display: {
    label: 'Find Messages',
    description: 'Search for messages by text content.',
  },
  operation: {
    inputFields: [
      {
        key: 'query',
        label: 'Search Text',
        type: 'string',
        required: true,
      },
      {
        key: 'chatGuid',
        label: 'Chat GUID (optional)',
        type: 'string',
        required: false,
      },
      {
        key: 'limit',
        label: 'Max Results',
        type: 'integer',
        required: false,
        default: '5',
      },
    ],
    perform,
    sample: {
      id: 'p:0/fake-guid-5678',
      guid: 'p:0/fake-guid-5678',
      text: 'Found message text',
      sender: '+11234567890',
      chatGuid: 'iMessage;-;+11234567890',
      dateCreated: 1700000000000,
    },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'guid', label: 'GUID' },
      { key: 'text', label: 'Text' },
      { key: 'sender', label: 'Sender' },
      { key: 'chatGuid', label: 'Chat GUID' },
      { key: 'dateCreated', label: 'Date Created', type: 'integer' },
    ],
  },
};
