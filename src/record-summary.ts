import type { ChannelManagerAccountV4 } from "@cordisx/protocol/channel-manager/v3";
import type { ManagerContentRecordSummaryV6 } from "@cordisx/protocol/manager-content-navigation/v6";
import { copy, type CopyKey } from "./locales.js";
import { platformLabel, stateTone } from "./presentation.js";
import { channelPlatformIcon } from "./platform-icons.js";

/** Public display data only. Host owns the summary and renders it before tabs. */
export function channelRecordSummary(account: ChannelManagerAccountV4, locale: string): ManagerContentRecordSummaryV6 {
  const label = (key: CopyKey) => ({ namespace: "channel", key, fallback: copy(locale, key) });
  const title = account.displayName ?? account.accountName ?? platformLabel(locale, account.adapterKind);
  const inbound = account.inbound.pending + account.inbound.retrying;
  const outbound = account.outbound.pending + account.outbound.retrying;
  return {
    leadingVisual: {
      kind: "identity",
      icon: channelPlatformIcon(account.adapterKind),
      ...(account.accountAvatar === undefined ? {} : { avatar: account.accountAvatar }),
    },
    title: { namespace: "channel", key: "record.title", params: { name: title }, fallback: title },
    description: {
      namespace: "channel",
      key: `platform.${account.adapterKind}`,
      fallback: platformLabel(locale, account.adapterKind),
    },
    statuses: [
      {
        id: "state",
        label: label(`state.${account.connectionState}`),
        icon: account.connectionState === "ready" ? "host:success" : "host:refresh",
        tone: stateTone(account.connectionState),
      },
      {
        id: "configuration",
        label: label(`configuration.${account.configurationState}`),
        icon: "host:key",
        tone: account.configurationState === "ready" ? "neutral" : "warning",
      },
    ],
    metrics: [
      { id: "inbound", label: label("status.inbound"), icon: "host:chat", tone: "neutral", value: inbound },
      { id: "outbound", label: label("status.outbound"), icon: "host:open", tone: "neutral", value: outbound },
      {
        id: "inbound-failed",
        label: label("status.inbound-failed"),
        icon: "host:warning",
        tone: account.inbound.deadLetter > 0 ? "danger" : "neutral",
        value: account.inbound.deadLetter,
      },
      {
        id: "outbound-failed",
        label: label("status.outbound-failed"),
        icon: "host:warning",
        tone: account.outbound.deadLetter > 0 ? "danger" : "neutral",
        value: account.outbound.deadLetter,
      },
    ],
  };
}
