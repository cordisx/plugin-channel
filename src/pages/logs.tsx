import { notifyResult } from "../notifications.js";
import type { ChannelManagerLogEntryV2 } from "@cordisx/protocol/channel-manager/v2";
import { Button, EmptyState } from "cordisx/ui";
import { useEffect, useState } from "cordisx/react";
import { accountByToken, canExportLogs, canQueryLogs, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { ChannelShell } from "../shell.js";

export function ChannelLogs(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const account = accountByToken(snapshot, routeToken(props.params.connectionToken));
  const [entries, setEntries] = useState<readonly ChannelManagerLogEntryV2[]>([]);
  const [cursor, setCursor] = useState<string>();
  const canQuery = canQueryLogs(account);
  const canExport = canExportLogs(account);

  const load = async (next?: string, append = false) => {
    if (account === undefined || !canQuery) return;
    try {
      const page = await manager.queryLogs({
        ...operationFence(snapshot),
        operation: "logs.query",
        target: { kind: "log", connectionToken: account.connectionToken },
        query: { limit: 25, ...(next === undefined ? {} : { cursor: next }) },
      });
      setEntries(current => append ? [...current, ...page.entries] : page.entries);
      setCursor(page.nextCursor);
    } catch {
      notifyResult(props, "logs.query", false);
    }
  };

  useEffect(() => {
    void load();
  }, [account?.connectionToken, snapshot.revision]);

  if (account === undefined) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "accounts.empty")} />
      </ChannelShell>
    );
  }

  const exportLogs = async () => {
    try {
      const result = await manager.exportLogs({
        ...operationFence(snapshot),
        operation: "logs.export",
        target: { kind: "log", connectionToken: account.connectionToken },
        query: { limit: 1000 },
      });
      notifyResult(props, "logs.export", result.status === "created");
    } catch {
      notifyResult(props, "logs.export", false);
    }
  };

  return (
    <ChannelShell status={account.implementationStatus}>
      <section data-channel-page="detail" data-channel-detail={account.connectionToken} data-channel-logs="true">
        <div className="cxc-channel-toolbar" role="toolbar" aria-label={copy(props.locale, "logs")}>
          <Button disabled={!canQuery} onClick={() => void load()}>{copy(props.locale, "logs")}</Button>
          <Button disabled={!canExport} onClick={() => void exportLogs()}>{copy(props.locale, "export")}</Button>
        </div>
        {entries.length === 0
          ? <EmptyState title={copy(props.locale, "logs.empty")} />
          : (
            <div className="cxc-channel-data-list">
              {entries.map(entry => (
                <article key={entry.entryId} className="cxc-channel-log-entry">
                  <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString(props.locale)}</time>
                  <span>{entry.event}</span>
                  <span className="cxc-channel-log-outcome">{entry.code}</span>
                </article>
              ))}
            </div>
          )}
        {cursor === undefined
          ? null
          : <Button onClick={() => void load(cursor, true)}>{copy(props.locale, "logs.load-more")}</Button>}
      </section>
    </ChannelShell>
  );
}
