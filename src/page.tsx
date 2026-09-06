import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { CordisXReactPageProps } from "cordisx/contracts";
import { ChannelConfiguration } from "./pages/configuration.js";
import { ChannelCreate } from "./pages/create.js";
import { ChannelList } from "./pages/list.js";
import { ChannelLogs } from "./pages/logs.js";
import { ChannelRuntime } from "./pages/runtime.js";
import { ChannelSessions } from "./pages/sessions.js";

export function createChannelPage(manager: ChannelManagerV2) {
  return function ChannelPage(props: CordisXReactPageProps) {
    const shared = { ...props, manager, locale: props.localization.getSnapshot().locale };
    if (props.routeId.endsWith(":settings")) return <ChannelList {...shared} />;
    if (props.routeId.endsWith(":create")) return <ChannelCreate {...shared} />;
    if (props.routeId.endsWith(":runtime")) return <ChannelRuntime {...shared} />;
    if (props.routeId.endsWith(":logs")) return <ChannelLogs {...shared} />;
    if (props.routeId.endsWith(":sessions")) return <ChannelSessions {...shared} />;
    return <ChannelConfiguration {...shared} />;
  };
}
