import type { ChannelManagerV14 } from "@cordisx/protocol/channel-manager/v14";
import type { ChannelSettingsSection } from "./settings.js";

/** New Hosts expose a Channel overlay; frozen v11-v12 Hosts retain the general-default form. */
export function channelSettingsFormMount(manager: Partial<ChannelManagerV14>, section: ChannelSettingsSection) {
  if (section === "continuation") {
    return typeof manager.mountContinuationDefaultsForm === "function"
      ? manager.mountContinuationDefaultsForm.bind(manager)
      : undefined;
  }
  if (section === "new-chats" && typeof manager.mountChannelCreationDefaultsForm === "function") {
    return manager.mountChannelCreationDefaultsForm.bind(manager);
  }
  return typeof manager.mountSettingsForm === "function" ? manager.mountSettingsForm.bind(manager, section) : undefined;
}
