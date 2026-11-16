import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { CordisXReactPageProps, NotificationsV1 } from "cordisx/contracts";
import { ChannelConfiguration } from "./pages/configuration.js";
import { ChannelCreate } from "./pages/create.js";
import { ChannelList } from "./pages/list.js";
import { ChannelLogs } from "./pages/logs.js";
import { ChannelRuntime } from "./pages/runtime.js";
import { ChannelSessions } from "./pages/sessions.js";
import { ChannelPolicy } from "./pages/policy.js";
import type { ChannelConversationCatalog } from "./conversation-catalog.js";
import { ChannelConversationDetail } from "./pages/conversation-detail.js";

export function createChannelPage(
  manager: ChannelManagerV2,
  notifications: NotificationsV1,
  conversations: ChannelConversationCatalog,
  summaryAvailable = false,
) {
  return function ChannelPage(props: CordisXReactPageProps) {
    const shared = {
      ...props,
      manager,
      notifications,
      summaryAvailable,
      conversations,
      locale: props.localization.getSnapshot().locale,
    };
    if (props.routeId.endsWith(":policy")) return <ChannelPolicy {...shared} />;
    if (props.routeId.endsWith(":settings")) return <ChannelList {...shared} />;
    if (props.routeId.endsWith(":create")) return <ChannelCreate {...shared} />;
    if (props.routeId.endsWith(":runtime")) return <ChannelRuntime {...shared} />;
    if (props.routeId.endsWith(":logs")) return <ChannelLogs {...shared} />;
    if (props.routeId.endsWith(":sessions")) {
      return <ChannelSessions key={String(props.params.connectionToken)} {...shared} />;
    }
    if (props.routeId.endsWith(":conversation-messages") || props.routeId.endsWith(":conversation-bindings")) {
      return <ChannelConversationDetail key={String(props.params.conversationToken)} {...shared} />;
    }
    return <ChannelConfiguration {...shared} />;
  };
}
