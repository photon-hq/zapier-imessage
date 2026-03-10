'use strict';

const addApiKeyToHeader = (request, z, bundle) => {
  request.headers['X-API-Key'] = bundle.authData.apiKey;
  return request;
};

const test = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/server/info`,
    method: 'GET',
  });
  return response.data;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'serverUrl',
      label: 'Server URL',
      type: 'string',
      required: true,
      helpText:
        'Your Photon iMessage server URL, e.g. https://abc.example.com',
    },
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'string',
      required: true,
      computed: false,
    },
  ],
  test,
  beforeRequest: [addApiKeyToHeader],
  connectionLabel: '{{bundle.authData.serverUrl}}',
};
