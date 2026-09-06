import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { CordisXReactPageProps } from "cordisx/contracts";

export interface ChannelPageProps extends CordisXReactPageProps {
  readonly manager: ChannelManagerV2;
  readonly locale: string;
}
