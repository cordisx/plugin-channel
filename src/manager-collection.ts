import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { ChannelManagerAccountV4, ChannelManagerV3 } from "@cordisx/protocol/channel-manager/v3";
import type { ManagerCollectionRegistryV2, ManagerCollectionSnapshotV2 } from "@cordisx/protocol/manager-collection/v2";
import type {
  ManagerCollectionDisplayText,
  ManagerCollectionItem,
  ManagerCollectionQueryV1,
  ManagerCollectionRegistrationV1,
  ManagerCollectionRegistryV1,
  ManagerCollectionSnapshotV1,
  ManagerCollectionSourceV1,
} from "cordisx/contracts";
import { copy, type CopyKey } from "./locales.js";
import { stateLabel } from "./model.js";
import { platformLabel } from "./presentation.js";
import { channelPlatformIcon } from "./platform-icons.js";

const COLLECTION_ID = "connections";
const STATES = ["ready", "starting", "retrying", "disabled", "stopped", "unavailable"] as const;

function supportsIdentity(manager: ChannelManagerV2): manager is ChannelManagerV3 {
  return "snapshotWithIdentity" in manager && typeof manager.snapshotWithIdentity === "function"
    && "refreshIdentity" in manager && typeof manager.refreshIdentity === "function";
}

function text(locale: string, key: CopyKey): ManagerCollectionDisplayText {
  return { namespace: "channel", key, fallback: copy(locale, key) };
}

export function channelCollectionRegistration(locale: string): ManagerCollectionRegistrationV1 {
  return {
    $schema:
      "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-registration.v1.schema.json",
    contract: "cordisx.manager-collection-registration/v1",
    schemaVersion: 1,
    id: COLLECTION_ID,
    label: text(locale, "accounts"),
    description: text(locale, "accounts.description"),
    views: [
      {
        id: "all",
        label: text(locale, "filter.all-states"),
        emptyTitle: text(locale, "accounts.empty"),
        emptyDescription: text(locale, "accounts.empty.description"),
      },
      ...STATES.map(state => ({
        id: state,
        label: text(locale, `state.${state}`),
        emptyTitle: text(locale, "accounts.view.empty"),
        emptyDescription: text(locale, "accounts.view.empty.description"),
      })),
    ],
    defaultView: "all",
    search: {
      fields: ["title", "summary"],
      normalization: "nfkc-casefold",
      label: text(locale, "search.connections"),
      placeholder: text(locale, "search.connections"),
      noMatchTitle: text(locale, "empty.search"),
      noMatchDescription: text(locale, "search.connections.no-match"),
    },
  };
}

function publicName(value: string): string {
  return Array.from(value.replace(/[\u0000-\u001F\u007F]/gu, "\uFFFD")).slice(0, 256).join("");
}

/** Supplies public connection data; the Host owns search, rows, views, routing and focus. */
export class ChannelCollectionSource implements ManagerCollectionSourceV1 {
  private readonly listeners = new Set<() => void>();
  private readonly subscription: ReturnType<ChannelManagerV2["subscribe"]>;
  private revision = 0;
  private disposed = false;
  private readonly lifetime = new AbortController();
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly manager: ChannelManagerV2, private readonly locale: string, identity = false) {
    this.subscription = manager.subscribe(() => {
      if (this.disposed) return;
      this.revision += 1;
      for (const listener of this.listeners) listener();
    });
    if (identity) this.refreshIdentity();
  }

  private refreshIdentity(): void {
    if (this.disposed) return;
    const manager = this.manager;
    if (!supportsIdentity(manager)) return;
    // One bounded read while this list is mounted; never reconnect or authenticate.
    void manager.refreshIdentity(this.lifetime.signal).catch(() => undefined).finally(() => {
      if (!this.disposed) this.refreshTimer = setTimeout(() => this.refreshIdentity(), 30_000);
    });
  }

  snapshotWithIdentity(query: ManagerCollectionQueryV1, signal: AbortSignal): ManagerCollectionSnapshotV2 {
    const manager = this.manager;
    const accounts = supportsIdentity(manager)
      ? manager.snapshotWithIdentity().accounts
      : manager.snapshot().accounts;
    const snapshot = this.buildSnapshot(query, signal, accounts);
    return {
      ...snapshot,
      $schema:
        "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-snapshot.v2.schema.json",
      contract: "cordisx.manager-collection-snapshot/v2",
      schemaVersion: 2,
      items: snapshot.items.map(item => {
        const account = accounts.find(account => account.connectionToken === item.id)!;
        const identity: ChannelManagerAccountV4 = account;
        return {
          ...item,
          leadingVisual: {
            kind: "identity",
            icon: channelPlatformIcon(account.adapterKind),
            ...(identity.accountAvatar === undefined ? {} : { avatar: identity.accountAvatar }),
          },
        };
      }),
    };
  }

  snapshot(query: ManagerCollectionQueryV1, signal: AbortSignal): ManagerCollectionSnapshotV1 {
    return this.buildSnapshot(query, signal, this.manager.snapshot().accounts);
  }

  private buildSnapshot(
    query: ManagerCollectionQueryV1,
    signal: AbortSignal,
    all: readonly ChannelManagerAccountV4[],
  ): ManagerCollectionSnapshotV1 {
    signal.throwIfAborted();
    if (this.disposed) throw new Error("Channel collection was disposed.");
    if (query.collectionId !== COLLECTION_ID || (query.view !== "all" && !STATES.some(state => state === query.view))) {
      throw new Error("Channel collection query does not match this source.");
    }
    // Return the complete selected view. Approximate plugin-side search can discard Unicode matches.
    const accounts = all.filter(account => query.view === "all" || account.connectionState === query.view);
    if (accounts.length > 1000) throw new Error("Channel collection exceeds its snapshot bound.");
    const items = accounts.map((account, order): ManagerCollectionItem => {
      const platform = platformLabel(this.locale, account.adapterKind);
      const name = publicName(account.displayName ?? account.accountName ?? platform);
      const state = stateLabel(this.locale, account.connectionState);
      return {
        id: account.connectionToken,
        title: { namespace: "channel", key: "record.title", params: { name }, fallback: name },
        summary: {
          namespace: "channel",
          key: "collection.summary",
          params: { platform, state },
          fallback: `${platform} · ${state}`,
        },
        leadingVisual: { kind: "semantic-icon", icon: "host:layers" },
        route: { id: "configuration", params: { connectionToken: account.connectionToken } },
        order,
        disabled: { value: false },
        actions: [],
      };
    });
    signal.throwIfAborted();
    return {
      $schema:
        "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-snapshot.v1.schema.json",
      contract: "cordisx.manager-collection-snapshot/v1",
      schemaVersion: 1,
      collectionId: COLLECTION_ID,
      queryRevision: query.queryRevision,
      view: query.view,
      normalizedSearch: query.search.normalized,
      revision: this.revision,
      items,
    };
  }

  subscribe(listener: () => void): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.lifetime.abort();
    clearTimeout(this.refreshTimer);
    this.subscription.dispose();
    this.listeners.clear();
  }
}

export function registerChannelCollection(
  registry: ManagerCollectionRegistryV1 & Partial<Pick<ManagerCollectionRegistryV2, "registerV2">>,
  manager: ChannelManagerV2,
  locale: string,
) {
  const identity = typeof registry.registerV2 === "function";
  const source = new ChannelCollectionSource(manager, locale, identity);
  try {
    const handle = registry.registerV2 === undefined
      ? registry.register(channelCollectionRegistration(locale), source)
      : registry.registerV2(channelCollectionRegistration(locale), {
        snapshot: (query, signal) => source.snapshotWithIdentity(query, signal),
        subscribe: listener => source.subscribe(listener),
        dispose: () => source.dispose(),
      });
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      try {
        handle.dispose();
      } finally {
        source.dispose();
      }
    };
  } catch (error) {
    source.dispose();
    throw error;
  }
}
