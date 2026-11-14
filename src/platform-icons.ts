import type { BrandIconV1 } from "@cordisx/protocol/brand-icon/v1";
import type { ChannelAdapterKind } from "@cordisx/protocol/channel-runtime/v1";
import icons from "./platform-icons.json" with { type: "json" };

/** Platform artwork belongs to Channel; card geometry and badge rendering belong to Host. */
export function channelPlatformIcon(kind: ChannelAdapterKind): BrandIconV1 {
  if (kind === "feishu" || kind === "lark") return icons.feishu as BrandIconV1;
  return kind === "simulator" ? "host:layers" : "host:chat";
}
