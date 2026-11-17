import type { ChannelManagerV13 } from "@cordisx/protocol/channel-manager/v13";
import type { ChannelSettingsFormSectionV2 } from "@cordisx/protocol/channel-manager/v12";

/** New Hosts expose a Channel overlay; frozen v11-v12 Hosts retain the general-default form. */
export function channelSettingsFormMount(manager: Partial<ChannelManagerV13>, section: ChannelSettingsFormSectionV2) {
  if (section === "new-chats" && typeof manager.mountChannelCreationDefaultsForm === "function") {
    return manager.mountChannelCreationDefaultsForm.bind(manager);
  }
  return typeof manager.mountSettingsForm === "function" ? manager.mountSettingsForm.bind(manager, section) : undefined;
}
