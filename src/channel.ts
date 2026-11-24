import type { ChannelManagerV7 } from "@cordisx/protocol/channel-manager/v7";
import type { ChannelManagerV10 } from "@cordisx/protocol/channel-manager/v10";
import type { ChannelManagerV12 } from "@cordisx/protocol/channel-manager/v12";
import type { ChannelManagerV11 } from "@cordisx/protocol/channel-manager/v11";
import {
  configurationConnectionControl,
  configurationConnectionCreate,
  configurationConnectionReconnect,
  configurationOnlyPresentation,
  snapshotOnlyPresentation,
} from "./presentation-capabilities.js";
import { channelSettingsTabs } from "./settings.js";
import { ChannelConversationCatalog } from "./conversation-catalog.js";
import { conversationRecordSummary } from "./record-summary.js";
import type { ChannelManagerV9 } from "@cordisx/protocol/channel-manager/v9";
import type { ChannelManagerV8 } from "@cordisx/protocol/channel-manager/v8";
import type { PluginRuntimeManifestV16 } from "@cordisx/protocol/plugin-manifest/v16";
import { withConfigurationHeader } from "./configuration-header.js";
import type { ManagerContentNavigationDeclarationV6 } from "@cordisx/protocol/manager-content-navigation/v6";
import type { ManagerContentNavigationDeclarationV2 } from "@cordisx/protocol/manager-content-navigation/v2";
import { channelRecordSummary } from "./record-summary.js";
import type { Context, Disposable } from "@deepseek-ai/cordis";
import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { ChannelManagerV4 } from "@cordisx/protocol/channel-manager/v4";
import type { ChannelManagerV6 } from "@cordisx/protocol/channel-manager/v6";
import {
  CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
  CORDISX_PAGE_SCHEMA_V4,
  CORDISX_ROUTE_SCHEMA_V2,
  CORDISX_SURFACE_CONTRIBUTION_SCHEMA_V11,
  type CordisXLocalizedText,
  type CordisXManagerContentNavigationDeclarationV1,
  type CordisXMessageParams,
  type CordisXPageMetadataV4,
  type CordisXPluginPresentation,
  type CordisXRouteDefinitionV2,
} from "cordisx/contracts";
import { defineReactPage } from "cordisx/react";
import { createChannelPage } from "./page.js";
import { type ChannelCopyMessages, channelLocales, copy } from "./locales.js";
import { availablePlatforms } from "./model.js";

export { icon } from "./brand-icon.js";

export const name = "channel";
export const inject = [
  "i18n",
  "slots",
  "pages",
  "routes",
  "commands",
  "managerContent",
  "channelManager",
  "notifications",
];

export const manifest = {
  $schema: "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/plugin-manifest.v16.schema.json",
  schemaVersion: 16,
  id: "channel",
  name: "Channels",
  capabilities: [
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
} as const satisfies PluginRuntimeManifestV16;

interface Messages extends ChannelCopyMessages {
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
  "platform.feishu": undefined;
  "platform.lark": undefined;
  "platform.simulator": undefined;
  "collection.summary": { platform: string; state: string };
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
  ["create", "route.create", "host:new"],
  ["policy", "policy.configure", "host:settings"],
  ["configuration", "route.configuration", "host:settings"],
  ["logs", "route.logs", "host:history"],
  ["runtime", "route.runtime", "host:open"],
  ["sessions", "route.sessions", "host:layers"],
  ["conversation-messages", "conversation.messages", "host:chat"],
  ["conversation-bindings", "conversation.bindings", "host:layers"],
  ...channelSettingsTabs.map(tab => [tab.id, tab.title, tab.icon] as const),
] as const satisfies readonly (readonly [string, keyof Messages, CordisXPageMetadataV4["icon"]])[];

const routes = [
  ["settings", "/manager/extensions/channels", "settings", "route.settings"],
  ["create", "/manager/extensions/channels/create", "create", "route.create"],
  ["policy", "/manager/extensions/channels/policy", "policy", "policy.configure"],
  ["configuration", "/manager/extensions/channels/:connectionToken", "configuration", "route.configuration"],
  ["logs", "/manager/extensions/channels/:connectionToken/logs", "logs", "route.logs"],
  ["runtime", "/manager/extensions/channels/:connectionToken/runtime", "runtime", "route.runtime"],
  ["sessions", "/manager/extensions/channels/:connectionToken/sessions", "sessions", "route.sessions"],
  [
    "conversation-messages",
    "/manager/extensions/channels/:connectionToken/conversations/:conversationToken/messages",
    "conversation-messages",
    "conversation.messages",
  ],
  [
    "conversation-bindings",
    "/manager/extensions/channels/:connectionToken/conversations/:conversationToken/bindings",
    "conversation-bindings",
    "conversation.bindings",
  ],
  ...channelSettingsTabs.map(tab =>
    [tab.id, `/manager/extensions/channels/preferences/${tab.segment}`, tab.id, tab.title] as const
  ),
] as const;

function page(
  [id, title, icon]: typeof pages[number],
  canCreate = false,
  canConfigurePolicy = false,
  settingsAvailable = false,
  snapshotOnly = false,
  connectionControl = false,
  connectionReconnect = false,
  credentialCreate = false,
): CordisXPageMetadataV4 {
  return {
    $schema: CORDISX_PAGE_SCHEMA_V4,
    schemaVersion: 4,
    id,
    title: message(id.startsWith("preferences-") ? "settings.title" : title),
    description: message(title),
    icon,
    chrome: "standard",
    ...(id === "settings"
      ? {
        breadcrumbs: [],
        headerActions: [
          ...(snapshotOnly ? [] : [{
            id: "policy",
            label: message(settingsAvailable ? "settings.title" : "policy.configure"),
            ariaLabel: message(settingsAvailable ? "settings.title" : "policy.configure"),
            icon: "host:settings" as const,
            command: { id: "configure-policy" },
            disabled: { value: !settingsAvailable && !canConfigurePolicy },
          }]),
          ...(!snapshotOnly || credentialCreate
            ? [{
              id: "create",
              label: message("route.create"),
              ariaLabel: message("route.create"),
              icon: "host:new" as const,
              command: { id: "open-create" },
              disabled: { value: !canCreate, ...(!canCreate ? { reason: message("create.unavailable") } : {}) },
            }]
            : []),
        ],
      }
      : {}),
    ...(id === "configuration" && (!snapshotOnly || connectionControl)
      ? {
        headerActions: [
          {
            id: "connection-toggle",
            label: message("connection.disable"),
            ariaLabel: message("connection.disable"),
            icon: "host:log-in" as const,
            command: { id: "toggle-connection" },
          },
          ...(!snapshotOnly || connectionReconnect
            ? [{
              id: "connection-reconnect",
              label: message("connection.reconnect"),
              ariaLabel: message("connection.reconnect"),
              icon: "host:refresh" as const,
              command: { id: "reconnect-connection" },
            }]
            : []),
        ],
      }
      : {}),
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
    title: message(id.startsWith("preferences-") ? "settings.title" : title),
    description: message(title),
  };
}

function declarationId(prefix: string, token: string): string {
  let hash = 0;
  for (const char of token) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${prefix}-${hash.toString(36)}`;
}

function platformTitle(kind: string): CordisXLocalizedText {
  if (kind === "feishu") return message("platform.feishu");
  if (kind === "lark") return message("platform.lark");
  if (kind === "simulator") return message("platform.simulator");
  return message("record.title", { name: kind });
}

function managerFor(ctx: Context): {
  readonly manager: ChannelManagerV2;
  readonly mode: "standard" | "snapshot-only" | "configuration-only";
} {
  const manager = ctx.channelManager as Partial<ChannelManagerV11>;
  const advertised = "forOwnPresentationService" in manager;
  let own: ChannelManagerV2 | undefined;
  let invalidConfigurationFacade = false;
  try {
    const getConfiguration: unknown = Reflect.get(manager, "forOwnConfigurationPresentationService");
    if (typeof getConfiguration === "function") {
      const configuration: unknown = getConfiguration.call(manager);
      if (configuration !== undefined) {
        if (configurationOnlyPresentation(configuration)) {
          return { manager: configuration, mode: "configuration-only" };
        }
        invalidConfigurationFacade = true;
      }
    } else if (getConfiguration !== undefined) {
      invalidConfigurationFacade = true;
    }
  } catch {
    invalidConfigurationFacade = true;
  }
  try {
    const getPresentation: unknown = Reflect.get(manager, "forOwnPresentationService");
    own = advertised && typeof getPresentation === "function"
      ? getPresentation.call(manager) as ChannelManagerV2 | undefined
      : advertised
      ? undefined
      : typeof manager.forOwnSettingsService === "function"
      ? manager.forOwnSettingsService()
      : typeof manager.forOwnConversationService === "function"
      ? manager.forOwnConversationService()
      : typeof manager.forOwnWorkflowService === "function"
      ? manager.forOwnWorkflowService()
      : typeof manager.forOwnConfigurationService === "function"
      ? manager.forOwnConfigurationService()
      : typeof manager.forOwnPageService === "function"
      ? manager.forOwnPageService()
      : typeof manager.forOwnReplyService === "function"
      ? manager.forOwnReplyService()
      : typeof manager.forOwnService === "function"
      ? manager.forOwnService()
      : undefined;
  } catch {
    own = undefined;
  }
  if (own && typeof own.snapshot === "function" && typeof own.subscribe === "function") {
    return {
      manager: own,
      mode: invalidConfigurationFacade || snapshotOnlyPresentation(own, advertised) ? "snapshot-only" : "standard",
    };
  }
  // Older Hosts or an inactive service must not manufacture a delegated grant.
  return {
    mode: advertised || invalidConfigurationFacade ? "snapshot-only" : "standard",
    manager: {
      snapshot: () => ({
        contract: "cordisx.channel-runtime-snapshot/v3",
        schemaVersion: 3,
        profileId: "unavailable",
        hostGeneration: "unavailable",
        revision: 0,
        observedAt: new Date(0).toISOString(),
        accounts: [],
        bindings: [],
        pendingAuthorizations: [],
        availableOperations: [],
      }),
      subscribe: () => ({ dispose() {} }),
      issue: async request => ({
        ...request,
        contract: "cordisx.channel-manager-target-result/v1",
        schemaVersion: 1,
        revision: 0,
        status: "unavailable",
        code: "SERVICE_UNAVAILABLE",
      }),
      execute: async request => ({
        ...request,
        contract: "cordisx.channel-manager-result/v2",
        schemaVersion: 2,
        revision: 0,
        status: "unavailable",
        code: "SERVICE_UNAVAILABLE",
      }),
      queryLogs: async () => {
        throw new Error("SERVICE_UNAVAILABLE");
      },
      exportLogs: async () => {
        throw new Error("SERVICE_UNAVAILABLE");
      },
    },
  };
}

/** Registers one page factory and one lifecycle-owned Channel projection. */
export function apply(ctx: Context): void {
  ctx.i18n.define<Messages>({
    namespace: "channel",
    locale: "en",
    default: true,
    messages: {
      ...channelLocales.en,
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
      "platform.feishu": "Feishu",
      "platform.lark": "Lark",
      "platform.simulator": "Simulator",
    },
  });
  ctx.i18n.define<Messages>({
    namespace: "channel",
    locale: "zh-CN",
    messages: {
      ...channelLocales["zh-CN"],
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
      "platform.feishu": "飞书",
      "platform.lark": "Lark",
      "platform.simulator": "模拟器",
    },
  });

  const selected = managerFor(ctx);
  const manager = selected.manager;
  const snapshotOnly = selected.mode === "snapshot-only";
  const configurationOnly = selected.mode === "configuration-only";
  const connectionControl = configurationOnly && configurationConnectionControl(manager);
  const connectionReconnect = connectionControl && configurationConnectionReconnect(manager);
  const restricted = selected.mode !== "standard";
  const credentialCreate = configurationOnly && configurationConnectionCreate(manager);
  const creationAvailable = !restricted || credentialCreate;
  const creationPlatforms = (snapshot: Parameters<typeof availablePlatforms>[0]) =>
    availablePlatforms(snapshot).filter(platform => !configurationOnly || platform !== "simulator");
  const settingsAvailable = !restricted
    && typeof (manager as Partial<ChannelManagerV11>).mountSettingsForm === "function";
  const modelsAvailable = !restricted
    && typeof (manager as Partial<ChannelManagerV12>).mountBindingModelForm === "function";
  const supportedSettingsTabs = channelSettingsTabs.filter(tab => tab.id !== "preferences-models" || modelsAvailable);
  // beta.63's SDK predates this additive public v6 service. Use the Protocol
  // declaration only when the actual Host advertises the matching version.
  const managerContent = ctx.managerContent as typeof ctx.managerContent & {
    readonly supportedSchemaVersions?: readonly number[];
    replaceProjection(projection: {
      readonly declarations: readonly (
        | CordisXManagerContentNavigationDeclarationV1
        | ManagerContentNavigationDeclarationV2
        | ManagerContentNavigationDeclarationV6
      )[];
      readonly recordTitles: Parameters<typeof ctx.managerContent.registerRecordTitles>[0];
    }): Disposable<void | Promise<void>>;
  };
  const summaryAvailable = managerContent.supportedSchemaVersions?.includes(6) ?? false;
  const conversations = new ChannelConversationCatalog();
  ctx.effect(() => () => conversations.dispose(), "channel: conversation display lifetime");
  const mount = defineReactPage<Messages>(
    createChannelPage(manager, ctx.notifications, conversations, summaryAvailable, snapshotOnly, configurationOnly),
  );
  for (const tuple of pages.filter(([id]) => id !== "settings")) {
    if (
      restricted && tuple[0] !== "runtime" && !(configurationOnly && tuple[0] === "configuration")
      && !(credentialCreate && tuple[0] === "create")
    ) continue;
    if (
      tuple[0].startsWith("preferences-") && !settingsAvailable || tuple[0] === "preferences-models" && !modelsAvailable
    ) continue;
    ctx.pages.register<Messages>(
      page(tuple, false, false, false, restricted, connectionControl, connectionReconnect),
      tuple[0] === "configuration" && (!restricted || connectionControl)
        ? withConfigurationHeader(ctx, manager, mount, !restricted || connectionReconnect)
        : mount,
    );
  }
  for (const definition of routes.map(route)) {
    if (
      restricted && definition.id !== "settings" && definition.id !== "runtime"
      && !(configurationOnly && definition.id === "configuration")
      && !(credentialCreate && definition.id === "create")
    ) continue;
    if (
      definition.id.startsWith("preferences-") && !settingsAvailable
      || definition.id === "preferences-models" && !modelsAvailable
    ) continue;
    ctx.routes.register(definition);
  }
  if (settingsAvailable) {
    const destination = (manager as ChannelManagerV11).registerChatCreationSettingsDestination?.({
      id: "preferences-defaults",
    });
    if (destination) ctx.effect(() => () => destination.dispose(), "channel: unified settings destination");
  }
  if (creationAvailable) {
    ctx.commands.register({ id: "open-create", title: message("route.create") }, async ({ signal }) => {
      if (signal.aborted || creationPlatforms(manager.snapshot()).length === 0) {
        return;
      }
      await ctx.routes.navigate({ id: "create" });
    });
  }

  if (!restricted) {
    ctx.commands.register({
      id: "configure-policy",
      title: message(settingsAvailable ? "settings.title" : "policy.configure"),
    }, async ({ signal }) => {
      const policyManager = manager as Partial<ChannelManagerV7>;
      if (settingsAvailable) {
        if (!signal.aborted) await ctx.routes.navigate({ id: "preferences-defaults" });
        return;
      }
      if (typeof policyManager.mountConversationReplyPolicyForm === "function") {
        if (!signal.aborted) await ctx.routes.navigate({ id: "policy" });
        return;
      }
      const configure = typeof policyManager.configureConversationReplyPolicy === "function"
        ? policyManager.configureConversationReplyPolicy
        : policyManager.configureConversationPolicy;
      if (signal.aborted || typeof configure !== "function") return;
      try {
        const result = await configure.call(policyManager, signal);
        if (result.status === "cancelled" || signal.aborted) return;
        ctx.notifications.show({
          kind: result.status === "applied" ? "channel.operation.saved" : "channel.operation.failed",
          type: result.status === "applied" ? "success" : "error",
          message: copy(
            document.documentElement.lang,
            result.status === "applied" ? "operation.saved" : "operation.failed",
          ),
        });
      } catch {
        if (!signal.aborted) {
          ctx.notifications.show({
            kind: "channel.operation.failed",
            type: "error",
            message: copy(document.documentElement.lang, "operation.failed"),
          });
        }
      }
    });
  }

  ctx.effect(() => {
    let disposeProjection: Disposable<void | Promise<void>> = () => {};
    let disposeListPage: Disposable<void | Promise<void>> = () => {};
    let listCanCreate: boolean | undefined;
    const refresh = () => {
      const snapshot =
        summaryAvailable && "snapshotWithIdentity" in manager && typeof manager.snapshotWithIdentity === "function"
          ? (manager as ChannelManagerV7).snapshotWithIdentity()
          : manager.snapshot();
      const canCreate = creationAvailable && creationPlatforms(snapshot).length > 0;
      if (listCanCreate !== canCreate) {
        void disposeListPage();
        disposeListPage = ctx.pages.register<Messages>(
          page(
            pages[0],
            canCreate,
            typeof (manager as Partial<ChannelManagerV7>).mountConversationReplyPolicyForm === "function"
              || typeof (manager as Partial<ChannelManagerV6>).configureConversationReplyPolicy === "function"
              || typeof (manager as Partial<ChannelManagerV4>).configureConversationPolicy === "function",
            settingsAvailable,
            restricted,
            false,
            false,
            credentialCreate,
          ),
          mount,
        );
        listCanCreate = canCreate;
      }
      const declarations: (
        | CordisXManagerContentNavigationDeclarationV1
        | ManagerContentNavigationDeclarationV2
        | ManagerContentNavigationDeclarationV6
      )[] = [{
        $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
        schemaVersion: 1,
        id: "root",
        route: { id: "settings" },
        header: { title: { kind: "route" } },
      }];
      if (creationAvailable) {
        declarations.push({
          $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
          schemaVersion: 1,
          id: "create",
          route: { id: "create" },
          parentRoute: { id: "settings" },
          header: { title: { kind: "route" } },
        });
      }
      if (!restricted) {
        declarations.push({
          $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1,
          schemaVersion: 1,
          id: "policy",
          route: { id: "policy" },
          parentRoute: { id: "settings" },
          header: { title: { kind: "route" } },
        });
      }
      if (settingsAvailable) {
        const settingsTabs = supportedSettingsTabs.map(tab => ({
          id: tab.id,
          route: { id: tab.id },
          label: message(tab.title),
        }));
        for (const tab of settingsTabs) {
          declarations.push({
            $schema:
              "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-content-navigation.v2.schema.json",
            schemaVersion: 2,
            id: tab.id,
            route: tab.route,
            parentRoute: { id: "settings" },
            header: { title: { kind: "route" } },
            tabs: settingsTabs,
          });
        }
      }
      const recordTitles = snapshot.accounts.map(account => ({
        id: account.connectionToken,
        title: account.displayName === undefined
          ? platformTitle(account.adapterKind)
          : message("record.title", { name: account.displayName }),
      }));
      for (const account of snapshot.accounts) {
        const visibleTabs =
          snapshotOnly || configurationOnly && account.lastErrorCode === "TENANT_IDENTIFICATION_PENDING"
            ? ["runtime"] as const
            : configurationOnly
            ? ["configuration", "runtime"] as const
            : ["configuration", "runtime", "logs", "sessions"] as const;
        const tabs = visibleTabs.map(id => ({
          id,
          route: { id, params: { connectionToken: account.connectionToken } },
        }));
        for (const tab of tabs) {
          declarations.push({
            ...(summaryAvailable
              ? {
                $schema:
                  "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-content-navigation.v6.schema.json" as const,
                schemaVersion: 6 as const,
                recordSummary: channelRecordSummary(account, document.documentElement.lang || "en"),
              }
              : { $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1, schemaVersion: 1 as const }),
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
      for (const conversation of restricted ? [] : conversations.all()) {
        const account = snapshot.accounts.find(account => account.connectionToken === conversation.connectionToken);
        if (!account) continue;
        recordTitles.push({
          id: conversation.conversationToken,
          title: message("record.title", { name: conversation.name }),
        });
        const tabs = (["conversation-messages", "conversation-bindings"] as const).map(id => ({
          id,
          route: {
            id,
            params: {
              connectionToken: conversation.connectionToken,
              conversationToken: conversation.conversationToken,
            },
          },
        }));
        for (const tab of tabs) {
          declarations.push({
            ...(summaryAvailable
              ? {
                $schema:
                  "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-content-navigation.v6.schema.json" as const,
                schemaVersion: 6 as const,
                recordSummary: conversationRecordSummary(
                  conversation,
                  account.adapterKind,
                  document.documentElement.lang || "en",
                ),
              }
              : { $schema: CORDISX_MANAGER_CONTENT_NAVIGATION_SCHEMA_V1, schemaVersion: 1 as const }),
            id: declarationId(tab.id, conversation.conversationToken),
            route: tab.route,
            parentRoute: { id: "sessions", params: { connectionToken: conversation.connectionToken } },
            header: {
              title: { kind: "record", recordIdParam: "conversationToken", fallback: message("conversations") },
            },
            tabs,
          });
        }
      }
      disposeProjection = managerContent.replaceProjection({ declarations, recordTitles });
    };
    refresh();
    const subscription = manager.subscribe(refresh);
    const unsubscribeConversations = conversations.subscribe(refresh);
    return () => {
      subscription.dispose();
      unsubscribeConversations();
      void disposeProjection();
      void disposeListPage();
    };
  }, "channel: manager content navigation projection");

  ctx.slots.register({
    $schema: CORDISX_SURFACE_CONTRIBUTION_SCHEMA_V11,
    schemaVersion: 11,
    name: "manager.settings.navigation-items",
    id: "channels",
    group: "after-settings",
    order: 180,
  }, { route: { id: "settings" }, navigationGroup: { id: "external-accounts" } });
}
