import type { ChannelSettingsFormSectionV1 } from "@cordisx/protocol/channel-manager/v11";

/** The Host renders these sibling tabs; this module declares routes, never tab DOM. */
export const channelSettingsTabs = [
  { id: "preferences-defaults", segment: "new-chats", title: "settings.new-chats", icon: "host:new" },
  { id: "preferences-messages", segment: "messages", title: "settings.messages", icon: "host:chat" },
  { id: "preferences-permissions", segment: "permissions", title: "settings.permissions", icon: "host:key" },
  { id: "preferences-organization", segment: "organization", title: "settings.organization", icon: "host:hierarchy" },
] as const;

export function channelSettingsSection(routeId: string): ChannelSettingsFormSectionV1 | undefined {
  return channelSettingsTabs.find(tab => routeId.endsWith(`:${tab.id}`))?.segment;
}
