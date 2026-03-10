# zapier-imessage

Official Zapier integration for the [Photon](https://github.com/photon-hq) iMessage server (advanced-imessage-kit).

## Prerequisites

- A running Photon iMessage server with a public URL and API key
- [Node.js](https://nodejs.org/) 18+
- [Zapier Platform CLI](https://github.com/zapier/zapier-platform/tree/main/packages/cli)

## Setup

```bash
npm install
zapier login
zapier push
```

## Authentication

When connecting the app in Zapier, provide:

- **Server URL** — your Photon server URL (e.g. `https://abc.example.com`)
- **API Key** — the API key from your Photon server

## Supported Actions

| Type    | Name                  | Description                                      |
| ------- | --------------------- | ------------------------------------------------ |
| Trigger | New Message Received  | Triggers when a new iMessage is received          |
| Action  | Send Message          | Send an iMessage from your Photon server          |
| Action  | Schedule a Message    | Schedule an iMessage to be sent at a future time  |
| Action  | React to Message      | Send a tapback reaction to a message              |
| Search  | Find Messages         | Search for messages by text content               |

## Development

```bash
npm test
zapier validate
zapier push
```
