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
    label: "Chat",
    type: "string",
    required: true,
    helpText:
      "Phone number, email, or group chat ID. Usually mapped from a trigger step (e.g. +1234567890 or a Chat GUID).",
  },
  {
    key: "message",
    label: "Message Text",
    type: "text",
    required: true,
  },
  {
    key: "effectId",
    label: "Message Effect",
    type: "string",
    required: false,
    helpText: "Optional bubble or screen effect to send with the message.",
    choices: [
      { value: "com.apple.messages.effect.CKConfettiEffect", label: "Confetti", sample: "com.apple.messages.effect.CKConfettiEffect" },
      { value: "com.apple.messages.effect.CKFireworksEffect", label: "Fireworks", sample: "com.apple.messages.effect.CKFireworksEffect" },
      { value: "com.apple.messages.effect.CKBalloonEffect", label: "Balloons", sample: "com.apple.messages.effect.CKBalloonEffect" },
      { value: "com.apple.messages.effect.CKHeartEffect", label: "Hearts", sample: "com.apple.messages.effect.CKHeartEffect" },
      { value: "com.apple.messages.effect.CKHappyBirthdayEffect", label: "Lasers", sample: "com.apple.messages.effect.CKHappyBirthdayEffect" },
      { value: "com.apple.messages.effect.CKShootingStarEffect", label: "Shooting Star", sample: "com.apple.messages.effect.CKShootingStarEffect" },
      { value: "com.apple.messages.effect.CKSparklesEffect", label: "Sparkles", sample: "com.apple.messages.effect.CKSparklesEffect" },
      { value: "com.apple.messages.effect.CKEchoEffect", label: "Echo", sample: "com.apple.messages.effect.CKEchoEffect" },
      { value: "com.apple.messages.effect.CKSpotlightEffect", label: "Spotlight", sample: "com.apple.messages.effect.CKSpotlightEffect" },
      { value: "com.apple.MobileSMS.expressivesend.gentle", label: "Gentle", sample: "com.apple.MobileSMS.expressivesend.gentle" },
      { value: "com.apple.MobileSMS.expressivesend.loud", label: "Loud", sample: "com.apple.MobileSMS.expressivesend.loud" },
      { value: "com.apple.MobileSMS.expressivesend.impact", label: "Slam", sample: "com.apple.MobileSMS.expressivesend.impact" },
      { value: "com.apple.MobileSMS.expressivesend.invisibleink", label: "Invisible Ink", sample: "com.apple.MobileSMS.expressivesend.invisibleink" },
    ],
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
