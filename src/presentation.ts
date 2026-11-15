import type {
  ChannelManagerAccountV3,
  ChannelManagerBindingV3,
  ChannelManagerLogEntryV2,
} from "@cordisx/protocol/channel-manager/v2";
import type { StatusBadgeProps } from "cordisx/ui";
import { copy } from "./locales.js";

export function platformLabel(locale: string, platform: string): string {
  if (platform === "feishu") return locale.startsWith("zh") ? "飞书" : "Feishu";
  if (platform === "lark") return "Lark";
  if (platform === "simulator") return copy(locale, "platform.simulator");
  return platform;
}

export function stateTone(state: ChannelManagerAccountV3["connectionState"]): NonNullable<StatusBadgeProps["tone"]> {
  if (state === "ready") return "success";
  if (state === "starting") return "info";
  if (state === "retrying") return "warning";
  if (state === "unavailable") return "danger";
  return "neutral";
}

export function bindingLabel(locale: string, state: ChannelManagerBindingV3["state"]): string {
  return copy(locale, `binding.${state}`);
}

export function configurationLabel(locale: string, state: ChannelManagerAccountV3["configurationState"]): string {
  return copy(locale, `configuration.${state}`);
}

export function logEventLabel(locale: string, event: ChannelManagerLogEntryV2["event"]): string {
  return copy(locale, `event.${event}`);
}

export function searchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/gu, " ");
}
