import type {
  ChannelManagerAccountV3,
  ChannelManagerLogEntryV2,
  ChannelManagerSnapshotV3,
} from "@cordisx/protocol/channel-manager/v2";
import { Button, Card, EmptyState, FilterToolbar, Icon, SearchField, Stack, StatusBadge, Text } from "cordisx/ui";
import { useEffect, useRef, useState } from "cordisx/react";
import { accountByToken, canExportLogs, canQueryLogs, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { logEventLabel, searchText } from "../presentation.js";
import { notifyResult } from "../notifications.js";
import { ChannelShell } from "../shell.js";

export function ChannelLogs(props: ChannelPageProps) {
  const { snapshot } = useChannelModel(props.manager);
  const account = accountByToken(snapshot, routeToken(props.params.connectionToken));
  if (account === undefined) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "accounts.empty")} />
      </ChannelShell>
    );
  }
  return <ConnectionLogs key={account.connectionToken} {...props} account={account} snapshot={snapshot} />;
}

function ConnectionLogs(
  props: ChannelPageProps & {
    readonly account: ChannelManagerAccountV3;
    readonly snapshot: ChannelManagerSnapshotV3;
  },
) {
  const { account, snapshot } = props;
  const [entries, setEntries] = useState<readonly ChannelManagerLogEntryV2[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const canQuery = canQueryLogs(account);
  const canExport = canExportLogs(account);

  const load = async (next?: string, notify = false) => {
    if (!canQuery) return;
    const id = ++request.current;
    setLoading(true);
    try {
      const page = await props.manager.queryLogs({
        ...operationFence(snapshot),
        operation: "logs.query",
        target: { kind: "log", connectionToken: account.connectionToken },
        query: { limit: 25, ...(next === undefined ? {} : { cursor: next }) },
      });
      if (request.current !== id) return;
      setEntries(current =>
        next === undefined
          ? page.entries
          : [...new Map([...current, ...page.entries].map(entry => [entry.entryId, entry])).values()]
      );
      setCursor(page.nextCursor);
      setFailed(false);
    } catch {
      if (request.current === id) {
        setFailed(true);
        if (notify) notifyResult(props, "logs.query", false);
      }
    } finally {
      if (request.current === id) setLoading(false);
    }
  };

  useEffect(() => {
    if (canQuery) void load();
    else {
      setEntries([]);
      setCursor(undefined);
      setLoading(false);
      setFailed(false);
    }
    return () => {
      request.current += 1;
    };
  }, [snapshot.revision, canQuery]);

  const exportLogs = async () => {
    if (!canExport || exporting) return;
    setExporting(true);
    try {
      const result = await props.manager.exportLogs({
        ...operationFence(snapshot),
        operation: "logs.export",
        target: { kind: "log", connectionToken: account.connectionToken },
        query: { limit: 1000 },
      });
      notifyResult(props, "logs.export", result.status === "created");
    } catch {
      notifyResult(props, "logs.export", false);
    } finally {
      setExporting(false);
    }
  };
  const needle = searchText(query);
  const filtered = entries.filter(entry =>
    searchText([
      logEventLabel(props.locale, entry.event),
      entry.event,
      entry.code,
      entry.occurredAt,
    ].join(" ")).includes(needle)
  );

  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack
        fill
        gap="small"
        data-channel-page="detail"
        data-channel-detail={account.connectionToken}
        data-channel-logs="true"
      >
        <FilterToolbar
          aria-label={copy(props.locale, "logs")}
          search={
            <SearchField
              value={query}
              onChange={setQuery}
              clearable
              clearLabel={copy(props.locale, "search.clear")}
              placeholder={copy(props.locale, "search.logs")}
              aria-label={copy(props.locale, "search.logs")}
            />
          }
          actions={
            <Stack direction="row" gap="small">
              <Button
                aria-label={copy(props.locale, "logs.refresh")}
                title={copy(props.locale, "logs.refresh")}
                disabled={!canQuery || loading}
                onClick={() => void load(undefined, true)}
              >
                <Icon name="refresh" />
              </Button>
              <Button
                aria-label={copy(props.locale, "export")}
                title={copy(props.locale, "export")}
                disabled={!canExport || exporting}
                onClick={() => void exportLogs()}
              >
                <Icon name="host:save" />
              </Button>
            </Stack>
          }
        />
        <div className="cxc-channel-results" aria-busy={loading}>
          {filtered.length === 0
            ? (
              <EmptyState
                title={copy(
                  props.locale,
                  !canQuery
                    ? "logs.unavailable"
                    : loading
                    ? "logs.loading"
                    : failed
                    ? "logs.failed"
                    : needle === ""
                    ? "logs.empty"
                    : "logs.no-match",
                )}
              />
            )
            : filtered.map(entry => (
              <Card key={entry.entryId} as="article" className="cxc-channel-log-entry" data-level={entry.level}>
                <span className="cxc-channel-log-icon">
                  <Icon name={entry.level === "error" || entry.level === "warn" ? "health" : "host:clock"} />
                </span>
                <Stack gap="small" className="cxc-channel-log-copy">
                  <Stack direction="row" align="center" justify="space-between" wrap gap="small">
                    <Text as="span">{logEventLabel(props.locale, entry.event)}</Text>
                    <StatusBadge
                      tone={entry.level === "error" ? "danger" : entry.level === "warn" ? "warning" : "neutral"}
                    >
                      {copy(props.locale, `logs.level.${entry.level}`)}
                    </StatusBadge>
                  </Stack>
                  <div className="cxc-channel-log-meta">
                    <time dateTime={entry.occurredAt}>
                      {new Date(entry.occurredAt).toLocaleString(props.locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </time>
                    {entry.code ? <code>{entry.code}</code> : null}
                  </div>
                </Stack>
              </Card>
            ))}
        </div>
        {cursor === undefined ? null : (
          <div className="cxc-channel-actions">
            <Button disabled={loading || !canQuery} onClick={() => void load(cursor, true)}>
              {copy(props.locale, loading ? "logs.loading-more" : "logs.load-more")}
            </Button>
          </div>
        )}
      </Stack>
    </ChannelShell>
  );
}
