import {
  defineCreate,
  defineInputFields,
  type CreatePerform,
} from "zapier-platform-core";
import { randomUUID } from "node:crypto";
import { requireInboundMessage } from "./inboundCheck.js";

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
    key: "message",
    label: "Message Text",
    type: "text",
    required: true,
  },
  {
    key: "subject",
    label: "Subject",
    type: "string",
    required: false,
  },
  {
    key: "effectId",
    label: "Message Effect",
    type: "string",
    required: false,
    helpText: "Optional bubble or screen effect to apply to the message.",
    choices: {
      "": "None",
      "com.apple.messages.effect.CKConfettiEffect": "Confetti",
      "com.apple.messages.effect.CKFireworksEffect": "Fireworks",
      "com.apple.messages.effect.CKBalloonEffect": "Balloons",
      "com.apple.messages.effect.CKHeartEffect": "Hearts",
      "com.apple.messages.effect.CKHappyBirthdayEffect": "Lasers",
      "com.apple.messages.effect.CKShootingStarEffect": "Shooting Star",
      "com.apple.messages.effect.CKSparklesEffect": "Sparkles",
      "com.apple.messages.effect.CKEchoEffect": "Echo",
      "com.apple.messages.effect.CKSpotlightEffect": "Spotlight",
      "com.apple.MobileSMS.expressivesend.gentle": "Gentle",
      "com.apple.MobileSMS.expressivesend.loud": "Loud",
      "com.apple.MobileSMS.expressivesend.impact": "Slam",
      "com.apple.MobileSMS.expressivesend.invisibleink": "Invisible Ink",
    },
  },
]);

const perform = (async (z, bundle) => {
  await requireInboundMessage(z, bundle, bundle.inputData.chatGuid);
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api/v1/message/text`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      chatGuid: bundle.inputData.chatGuid,
      message: bundle.inputData.message,
      method: "private-api",
      subject: bundle.inputData.subject || undefined,
      effectId: bundle.inputData.effectId || undefined,
      tempGuid: randomUUID(),
    },
  });

  const data = response.data as Record<string, unknown>;
  return { id: data.guid || data.id || bundle.inputData.chatGuid, ...data };
}) satisfies CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "send_message",
  noun: "Message",

  display: {
    label: "Send Message",
    description: "Send an iMessage from your Photon server.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "p:0/sent-guid-1234",
      status: 200,
      message: "Message sent successfully",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
    ],
  },
});
