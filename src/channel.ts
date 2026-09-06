import type { Context, Disposable } from "@deepseek-ai/cordis";
import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import {
  CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
  CORDISX_PAGE_SCHEMA_V3,
  CORDISX_PLUGIN_MANIFEST_SCHEMA_V8,
  CORDISX_ROUTE_SCHEMA_V2,
  type CordisXLocalizedText,
  type CordisXManagerContentNavigationDeclarationV1,
  type CordisXMessageParams,
  type CordisXPageMetadataV3,
  type CordisXPluginManifestV8,
  type CordisXPluginPresentation,
  type CordisXRouteDefinitionV2,
} from "cordisx/contracts";
import { defineReactPage } from "cordisx/react";
import { createChannelPage } from "./page.js";

export const name = "channel";
export const inject = ["i18n", "slots", "pages", "routes", "managerContent", "channelManager"];

export const manifest = {
  $schema: CORDISX_PLUGIN_MANIFEST_SCHEMA_V8,
  schemaVersion: 8,
  id: "channel",
  name: "Channels",
  capabilities: [
    { name: "channel.accounts.read", required: true, scope: {} },
    {
      name: "channel.accounts.connect",
      required: false,
      scope: { channelAccounts: [{ adapterId: "simulator", accountId: "local" }] },
    },
    {
      name: "channel.events.receive",
      required: false,
      scope: { channelTenants: [{ adapterId: "simulator", accountId: "local", tenantId: "test" }] },
    },
    {
      name: "channel.events.subscribe",
      required: false,
      scope: { channelTenants: [{ adapterId: "simulator", accountId: "local", tenantId: "test" }] },
    },
    {
      name: "channel.messages.send",
      required: false,
      scope: {
        channelConversations: [{
          adapterId: "simulator",
          accountId: "local",
          tenantId: "test",
          conversationId: "direct-alice",
          kind: "direct",
        }],
      },
    },
    { name: "channel.bindings.read", required: false, scope: {} },
    { name: "channel.bindings.write", required: false, scope: {} },
    {
      name: "channel.attachments.read",
      required: false,
      scope: {
        channelConversations: [{
          adapterId: "simulator",
          accountId: "local",
          tenantId: "test",
          conversationId: "direct-alice",
          kind: "direct",
        }],
      },
    },
  ],
  services: [{
    id: "runtime",
    kind: "channel-adapter",
    entry: "./dist/service.mjs",
    configuration: {
      kind: "host",
      schema:
        "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/channel-service-config.v1.schema.json",
      configApplies: "restart",
    },
  }],
} as const satisfies CordisXPluginManifestV8;

interface Messages {
  "plugin.name": undefined;
  "plugin.description": undefined;
  "route.settings": undefined;
  "route.create": undefined;
  "route.configuration": undefined;
  "route.logs": undefined;
  "route.runtime": undefined;
  "route.sessions": undefined;
  "record.fallback": undefined;
  "record.title": { name: string };
}

function message<Key extends keyof Messages>(
  key: Key,
  ...args: Messages[Key] extends CordisXMessageParams ? [params: Messages[Key]] : [params?: undefined]
): CordisXLocalizedText {
  return { namespace: "channel", key, ...(args[0] === undefined ? {} : { params: args[0] }) };
}

export const presentation = {
  name: message("plugin.name"),
  description: message("plugin.description"),
} satisfies CordisXPluginPresentation;

const pages = [
  ["settings", "route.settings", "host:layers"],
  ["create", "route.create", "host:create"],
  ["configuration", "route.configuration", "host:settings"],
  ["logs", "route.logs", "host:history"],
  ["runtime", "route.runtime", "host:open"],
  ["sessions", "route.sessions", "host:layers"],
] as const satisfies readonly (readonly [string, keyof Messages, CordisXPageMetadataV3["icon"]])[];

const routes = [
  ["settings", "/manager/extensions/channels", "settings", "route.settings"],
  ["create", "/manager/extensions/channels/create", "create", "route.create"],
  ["configuration", "/manager/extensions/channels/:connectionToken", "configuration", "route.configuration"],
  ["logs", "/manager/extensions/channels/:connectionToken/logs", "logs", "route.logs"],
  ["runtime", "/manager/extensions/channels/:connectionToken/runtime", "runtime", "route.runtime"],
  ["sessions", "/manager/extensions/channels/:connectionToken/sessions", "sessions", "route.sessions"],
] as const;

function page([id, title, icon]: typeof pages[number]): CordisXPageMetadataV3 {
  return {
    $schema: CORDISX_PAGE_SCHEMA_V3,
    schemaVersion: 3,
    id,
    title: message(title),
    description: message(title),
    icon,
    chrome: "standard",
  };
}

function route([id, path, pageId, title]: typeof routes[number]): CordisXRouteDefinitionV2<"manager.content"> {
  return {
    $schema: CORDISX_ROUTE_SCHEMA_V2,
    schemaVersion: 2,
    id,
    path,
    outlet: "manager.content",
    page: pageId,
    title: message(title),
    description: message(title),
  };
}

function declarationId(prefix: string, token: string): string {
  let hash = 0;
  for (const char of token) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${prefix}-${hash.toString(36)}`;
}

function managerFor(ctx: Context): ChannelManagerV2 {
  return ctx.channelManager;
}

/** Registers one page factory and one lifecycle-owned Channel projection. */
export function apply(ctx: Context): void {
  ctx.i18n.define<Messages>({
    namespace: "channel",
    locale: "en",
    default: true,
    messages: {
      "plugin.name": "Channels",
      "plugin.description": "Manage Channel connections and sessions.",
      "route.settings": "Channels",
      "route.create": "New channel",
      "route.configuration": "Configuration",
      "route.logs": "Logs",
      "route.runtime": "Runtime status",
      "route.sessions": "Connections & sessions",
      "record.fallback": "Channel",
      "record.title": "{name}",
    },
  });
  ctx.i18n.define<Messages>({
    namespace: "channel",
    locale: "zh-CN",
    messages: {
      "plugin.name": "渠道",
      "plugin.description": "管理渠道连接与会话。",
      "route.settings": "渠道",
      "route.create": "新建渠道",
      "route.configuration": "配置",
      "route.logs": "日志",
      "route.runtime": "运行状态",
      "route.sessions": "连接与会话",
      "record.fallback": "渠道",
      "record.title": "{name}",
    },
  });

  const manager = managerFor(ctx);
  const mount = defineReactPage<Messages>(createChannelPage(manager));
  for (const metadata of pages.map(page)) ctx.pages.register<Messages>(metadata, mount);
  for (const definition of routes.map(route)) ctx.routes.register(definition);

  ctx.effect(() => {
    let disposeProjection: Disposable<void | Promise<void>> = () => {};
    const refresh = () => {
      const snapshot = manager.snapshot();
      const declarations: CordisXManagerContentNavigationDeclarationV1[] = [{
        $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
        schemaVersion: 1,
        id: "root",
        route: { id: "settings" },
        header: { title: { kind: "route" } },
      }, {
        $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
        schemaVersion: 1,
        id: "create",
        route: { id: "create" },
        parentRoute: { id: "settings" },
        header: { title: { kind: "route" } },
      }];
      const recordTitles = snapshot.accounts.map(account => ({
        id: account.connectionToken,
        title: message("record.title", { name: account.displayName ?? account.adapterKind }),
      }));
      for (const account of snapshot.accounts) {
        const tabs = (["configuration", "runtime", "logs", "sessions"] as const).map(id => ({
          id,
          route: { id, params: { connectionToken: account.connectionToken } },
        }));
        for (const tab of tabs) {
          declarations.push({
            $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
            schemaVersion: 1,
            id: declarationId(tab.id, account.connectionToken),
            route: tab.route,
            parentRoute: { id: "settings" },
            header: {
              title: { kind: "record", recordIdParam: "connectionToken", fallback: message("record.fallback") },
            },
            tabs,
          });
        }
      }
      disposeProjection = ctx.managerContent.replaceProjection({ declarations, recordTitles });
    };
    refresh();
    const subscription = manager.subscribe(refresh);
    return () => {
      subscription.dispose();
      void disposeProjection();
    };
  }, "channel: manager content navigation projection");

  ctx.slots.register({
    name: "manager.settings.navigation-items",
    id: "channels",
    group: "after-settings",
    order: 180,
  }, { route: { id: "settings" } });
}
