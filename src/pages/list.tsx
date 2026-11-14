import { Button, EmptyState, FilterToolbar, Icon, SearchField, Select, Stack, StatusBadge } from "cordisx/ui";
import { useMemo, useState } from "cordisx/react";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { availablePlatforms, stateLabel, useChannelModel } from "../model.js";
import { platformLabel, searchText, stateTone } from "../presentation.js";
import { ChannelShell } from "../shell.js";

export function ChannelList(props: ChannelPageProps) {
  const { snapshot } = useChannelModel(props.manager);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const canCreate = availablePlatforms(snapshot).length > 0;
  const accounts = useMemo(() => {
    const needle = searchText(query);
    return snapshot.accounts.filter(account =>
      (state === "all" || state === account.connectionState)
      && searchText(
        [
          account.displayName,
          platformLabel(props.locale, account.adapterKind),
          account.adapterKind,
          stateLabel(props.locale, account.connectionState),
        ].filter(Boolean).join(" "),
      ).includes(needle)
    );
  }, [query, state, snapshot, props.locale]);
  const stateOptions = [
    { value: "all", label: copy(props.locale, "filter.all-states") },
    ...(["ready", "starting", "retrying", "disabled", "stopped", "unavailable"] as const).map(value => ({
      value,
      label: stateLabel(props.locale, value),
    })),
  ];

  return (
    <ChannelShell status={snapshot.accounts.length === 0 ? "unavailable" : "implemented"}>
      <Stack fill gap="small" data-channel-page="list">
        <FilterToolbar
          aria-label={copy(props.locale, "accounts")}
          search={
            <SearchField
              value={query}
              onChange={setQuery}
              clearable
              clearLabel={copy(props.locale, "search.clear")}
              placeholder={copy(props.locale, "search.connections")}
              aria-label={copy(props.locale, "search.connections")}
            />
          }
          filters={[
            <Select
              key="state"
              value={state}
              options={stateOptions}
              density="compact"
              onChange={setState}
              aria-label={copy(props.locale, "status.state")}
            />,
          ]}
          actions={
            <Button
              data-channel-create="true"
              aria-label={copy(props.locale, "create")}
              title={copy(props.locale, canCreate ? "create" : "create.unavailable")}
              disabled={!canCreate}
              onClick={() => void props.navigation.navigate({ id: "create" })}
            >
              <Icon name="create" />
            </Button>
          }
        />
        <div className="cxc-channel-results" data-host-collection="channel-list">
          {accounts.length === 0
            ? (
              <EmptyState
                title={copy(props.locale, query.trim() === "" && state === "all" ? "accounts.empty" : "empty.search")}
              />
            )
            : (
              <ul className="cxc-channel-list">
                {accounts.map(account => {
                  const platform = platformLabel(props.locale, account.adapterKind);
                  const title = account.displayName ?? platform;
                  return (
                    <li key={account.connectionToken} data-collection-item={account.connectionToken}>
                      <button
                        type="button"
                        className="cxc-channel-account"
                        onClick={() =>
                          void props.navigation.navigate({
                            id: "configuration",
                            params: { connectionToken: account.connectionToken },
                          })}
                      >
                        <span className="cxc-channel-avatar" aria-hidden="true">{title.slice(0, 2)}</span>
                        <span className="cxc-channel-account-copy">
                          <strong title={title}>{title}</strong>
                          {title === platform ? null : <span className="cxc-channel-meta">{platform}</span>}
                        </span>
                        <StatusBadge tone={stateTone(account.connectionState)}>
                          {stateLabel(props.locale, account.connectionState)}
                        </StatusBadge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </Stack>
    </ChannelShell>
  );
}
