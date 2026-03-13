import {
  defineCreate,
  type CreatePerform,
} from "zapier-platform-core";
import type { ZObject } from "zapier-platform-core";
import type { Bundle } from "zapier-platform-core";
import type { PlainInputField } from "zapier-platform-core";
import { randomUUID } from "node:crypto";
import { requireInboundMessage } from "./inboundCheck.js";

const ACTION_CHOICES: Array<{ value: string; label: string; sample: string }> = [
  { value: "send_message", label: "Send Message", sample: "send_message" },
  { value: "add_participant", label: "Add Participant to Group", sample: "add_participant" },
  { value: "remove_participant", label: "Remove Participant From Group", sample: "remove_participant" },
];

type ActionType = "send_message" | "add_participant" | "remove_participant";

const actionTypeField: PlainInputField = {
  key: "action_type",
  label: "Action",
  type: "string",
  required: true,
  choices: [...ACTION_CHOICES],
  altersDynamicFields: true,
  helpText: "Choose what you want to do. The step title will match this action.",
};

const sendMessageFields: PlainInputField[] = [
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
      { value: "com.apple.messages.effect.CKSparklesEffect", label: "Sparkles", sample: "com.apple.messages.effect.CKSparklesEffect" },
      { value: "com.apple.MobileSMS.expressivesend.gentle", label: "Gentle", sample: "com.apple.MobileSMS.expressivesend.gentle" },
      { value: "com.apple.MobileSMS.expressivesend.loud", label: "Loud", sample: "com.apple.MobileSMS.expressivesend.loud" },
      { value: "com.apple.MobileSMS.expressivesend.invisibleink", label: "Invisible Ink", sample: "com.apple.MobileSMS.expressivesend.invisibleink" },
    ],
  },
];

const participantFields: PlainInputField[] = [
  {
    key: "chatGuid",
    label: "Group Chat",
    type: "string",
    required: true,
    helpText: "The group chat identifier. Usually mapped from a trigger step.",
  },
  {
    key: "address",
    label: "Phone Number or Email",
    type: "string",
    required: true,
    helpText: "Phone number or email, e.g. +1234567890",
  },
];

function getDynamicFields(_z: ZObject, bundle: Bundle): PlainInputField[] {
  const action = bundle.inputData?.action_type as ActionType | undefined;
  if (action === "send_message") return sendMessageFields;
  if (action === "add_participant" || action === "remove_participant") return participantFields;
  return [];
}

const inputFields = [actionTypeField, getDynamicFields];

type InputData = {
  action_type?: ActionType;
  chatGuid?: string;
  message?: string;
  effectId?: string;
  address?: string;
};

const perform = (async (z, bundle) => {
  const input = bundle.inputData as InputData;
  const action = input.action_type;
  const serverUrl = bundle.authData.serverUrl as string;

  if (action === "send_message") {
    const chatGuid = input.chatGuid!;
    await requireInboundMessage(z, bundle, chatGuid);
    const response = await z.request({
      url: `${serverUrl}/api/v1/message/text`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        chatGuid,
        message: input.message,
        method: "private-api",
        effectId: input.effectId || undefined,
        tempGuid: randomUUID(),
      },
    });
    const data = response.data as Record<string, unknown>;
    return { id: data.guid || data.id || chatGuid, ...data };
  }

  if (action === "add_participant" || action === "remove_participant") {
    const chatGuid = input.chatGuid!;
    await requireInboundMessage(z, bundle, chatGuid);
    const path =
      action === "add_participant"
        ? "/participant/add"
        : "/participant/remove";
    const response = await z.request({
      url: `${serverUrl}/api/v1/chat/${encodeURIComponent(chatGuid)}${path}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { address: input.address },
    });
    const data = response.data as Record<string, unknown>;
    return {
      id: data.id || `${chatGuid}-${input.address}`,
      ...data,
    };
  }

  throw new z.errors.Error(`Unknown action: ${action}`, "InvalidData");
}) as CreatePerform<typeof inputFields>;

export default defineCreate({
  key: "perform_action",
  noun: "Action",

  display: {
    label: "iMessage Action",
    description:
      "Choose one action to run: Send Message, Add Participant to Group, or Remove Participant. Use this when you want a single step that can do different things.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "action-result-1",
      status: 200,
      message: "Success",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "status", label: "Status", type: "integer" },
      { key: "message", label: "Message" },
      { key: "chatGuid", label: "Chat GUID" },
      { key: "address", label: "Address" },
    ],
  },
});
