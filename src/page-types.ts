import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { CordisXReactPageProps, NotificationsV1 } from "cordisx/contracts";

export interface ChannelPageProps extends CordisXReactPageProps {
  readonly notifications: NotificationsV1;
  readonly manager: ChannelManagerV2;
  readonly locale: string;
}
