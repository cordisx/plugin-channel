import { Button, EmptyState, Icon } from "cordisx/ui";
import { useMemo, useState } from "cordisx/react";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { stateLabel, useChannelModel } from "../model.js";
import { ChannelShell } from "../shell.js";

export function ChannelList(props: ChannelPageProps) {
  const { snapshot } = useChannelModel(props.manager);
  const [query, setQuery] = useState("");
  const accounts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.accounts.filter(account =>
      needle === "" || [account.displayName, account.adapterKind, account.connectionState]
        .filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [query, snapshot]);

  return (
    <ChannelShell status={snapshot.accounts.length === 0 ? "unavailable" : "implemented"}>
      <div data-channel-page="list">
        <div className="cxc-channel-toolbar" role="toolbar" aria-label={copy(props.locale, "accounts")}>
          <span className="cxc-channel-search">
            <Icon name="search" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.currentTarget.value)}
              aria-label={copy(props.locale, "accounts")}
            />
          </span>
          <Button
            data-channel-create="true"
            aria-label={copy(props.locale, "create")}
            title={copy(props.locale, "create")}
            disabled={!snapshot.availableOperations.includes("target.connection.create.simulator")}
            onClick={() => void props.navigation.navigate({ id: "create" })}
          >
            <Icon name="create" />
          </Button>
        </div>
        {accounts.length === 0
          ? (
            <EmptyState
              data-host-collection="channel-list"
              title={copy(props.locale, query.trim() === "" ? "accounts.empty" : "empty.search")}
            />
          )
          : (
            <div className="cxc-channel-list" data-host-collection="channel-list">
              {accounts.map(account => (
                <button
                  key={account.connectionToken}
                  type="button"
                  className="cxc-channel-account"
                  data-collection-item={account.connectionToken}
                  onClick={() =>
                    void props.navigation.navigate({
                      id: "configuration",
                      params: { connectionToken: account.connectionToken },
                    })}
                >
                  <span className="cxc-channel-avatar">{(account.displayName ?? account.adapterKind).slice(0, 2)}</span>
                  <span className="cxc-channel-account-copy">
                    <strong>{account.displayName ?? account.adapterKind}</strong>
                    <span className="cxc-channel-meta">{account.adapterKind}</span>
                  </span>
                  <span className="cxc-channel-status" data-state={account.connectionState}>
                    {stateLabel(props.locale, account.connectionState)}
                  </span>
                </button>
              ))}
            </div>
          )}
      </div>
    </ChannelShell>
  );
}
