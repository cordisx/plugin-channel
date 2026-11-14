import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
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

const COLLECTION_ID = "connections";
const STATES = ["ready", "starting", "retrying", "disabled", "stopped", "unavailable"] as const;

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

  constructor(private readonly manager: ChannelManagerV2, private readonly locale: string) {
    this.subscription = manager.subscribe(() => {
      if (this.disposed) return;
      this.revision += 1;
      for (const listener of this.listeners) listener();
    });
  }

  snapshot(query: ManagerCollectionQueryV1, signal: AbortSignal): ManagerCollectionSnapshotV1 {
    signal.throwIfAborted();
    if (this.disposed) throw new Error("Channel collection was disposed.");
    if (query.collectionId !== COLLECTION_ID || (query.view !== "all" && !STATES.some(state => state === query.view))) {
      throw new Error("Channel collection query does not match this source.");
    }
    // Return the complete selected view. Approximate plugin-side search can discard Unicode matches.
    const accounts = this.manager.snapshot().accounts.filter(account =>
      query.view === "all" || account.connectionState === query.view
    );
    if (accounts.length > 1000) throw new Error("Channel collection exceeds its snapshot bound.");
    const items = accounts.map((account, order): ManagerCollectionItem => {
      const platform = platformLabel(this.locale, account.adapterKind);
      const name = publicName(account.displayName ?? platform);
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
    this.subscription.dispose();
    this.listeners.clear();
  }
}

export function registerChannelCollection(
  registry: ManagerCollectionRegistryV1,
  manager: ChannelManagerV2,
  locale: string,
) {
  const source = new ChannelCollectionSource(manager, locale);
  try {
    const handle = registry.register(channelCollectionRegistration(locale), source);
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
