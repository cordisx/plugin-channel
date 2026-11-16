import { Button, Card, EmptyState, FilterToolbar, Icon, SearchField, Stack, StatusBadge, Text } from "cordisx/ui";
import { useEffect, useRef, useState } from "cordisx/react";
import type { ChannelManagerConversationActivityV1, ChannelManagerV10 } from "@cordisx/protocol/channel-manager/v10";
import type { ChannelManagerBindingDisplayV1 } from "@cordisx/protocol/channel-manager/v9";
import { operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { bindingLabel, searchText } from "../presentation.js";
import { ChannelShell } from "../shell.js";
import { notifyResult } from "../notifications.js";
import { BindingExecutionForm } from "./legacy-sessions.js";

export function ChannelConversationDetail(props: ChannelPageProps) {
  const manager = props.manager as Partial<ChannelManagerV10>;
  if (!manager.conversationDetail || !manager.conversationActivity || !manager.conversationBindings) {
    return <EmptyState title={copy(props.locale, "conversation.unavailable")} />;
  }
  return <ConversationDetail {...props} manager={manager as ChannelManagerV10} />;
}
function ConversationDetail(props: ChannelPageProps & { readonly manager: ChannelManagerV10 }) {
  const { snapshot } = useChannelModel(props.manager);
  const token = routeToken(props.params.conversationToken);
  const showBindings = props.routeId.endsWith(":conversation-bindings");
  const [entries, setEntries] = useState<readonly ChannelManagerConversationActivityV1[]>([]);
  const [bindings, setBindings] = useState<readonly ChannelManagerBindingDisplayV1[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string>();
  const [confirm, setConfirm] = useState<string>();
  const [executionTarget, setExecutionTarget] = useState<string>();
  const request = useRef<AbortController | undefined>(undefined);
  const load = async (next?: string) => {
    if (!token) return;
    request.current?.abort();
    const lifetime = new AbortController();
    request.current = lifetime;
    setLoading(true);
    try {
      const detail = await props.manager.conversationDetail(token, lifetime.signal);
      if (lifetime.signal.aborted) return;
      props.conversations.adopt([detail.conversation]);
      if (showBindings) {
        const page = await props.manager.conversationBindings({
          conversationToken: token,
          limit: 100,
          ...(next === undefined ? {} : { afterCursor: next }),
        }, lifetime.signal);
        if (lifetime.signal.aborted) return;
        setBindings(current =>
          next
            ? [...new Map([...current, ...page.bindings].map(item => [item.bindingToken, item])).values()]
            : page.bindings
        );
        setCursor(page.nextCursor);
        setTotal(page.total);
      } else {
        const page = await props.manager.conversationActivity({
          conversationToken: token,
          limit: 25,
          ...(next === undefined ? {} : { afterCursor: next }),
        }, lifetime.signal);
        if (lifetime.signal.aborted) return;
        setEntries(current =>
          next
            ? [...new Map([...current, ...page.entries].map(entry => [entry.entryId, entry])).values()]
            : page.entries
        );
        setCursor(page.nextCursor);
        setTotal(page.total);
      }
      setFailed(false);
    } catch {
      if (!lifetime.signal.aborted) setFailed(true);
    } finally {
      if (!lifetime.signal.aborted) setLoading(false);
    }
  };
  useEffect(() => {
    setEntries([]);
    setBindings([]);
    setCursor(undefined);
    setQuery("");
    setExecutionTarget(undefined);
    void load();
    return () => request.current?.abort();
  }, [props.manager, token, showBindings, snapshot.revision]);
  const needle = searchText(query);
  const visibleEntries = entries.filter(entry =>
    searchText(
      [entry.text, entry.senderName, entry.sessionName, copy(props.locale, `activity.${entry.state}`)].join(" "),
    ).includes(needle)
  );
  const visibleBindings = bindings.filter(binding =>
    searchText([binding.sessionName, bindingLabel(props.locale, binding.state)].join(" ")).includes(needle)
  );
  const run = async (
    binding: ChannelManagerBindingDisplayV1,
    operation: "binding.archive" | "binding.restore" | "binding.unbind",
  ) => {
    if (busy || !binding.availableOperations.includes(operation)) return;
    setBusy(binding.bindingToken);
    try {
      const result = await props.manager.execute({
        ...operationFence(snapshot),
        operation,
        target: { kind: "binding", bindingToken: binding.bindingToken, bindingRevision: binding.bindingRevision },
      });
      notifyResult(props, operation, result.status === "applied");
      if (result.status === "applied") {
        setConfirm(undefined);
        void load();
      }
    } catch {
      notifyResult(props, operation, false);
    } finally {
      setBusy(undefined);
    }
  };
  const open = async (binding: ChannelManagerBindingDisplayV1) => {
    if (busy || !props.manager.openBindingConversation) return;
    setBusy(binding.bindingToken);
    try {
      const result = await props.manager.openBindingConversation(binding.bindingToken, props.signal);
      if (result.status !== "opened") notifyResult(props, "binding.restore", false);
    } catch {
      if (!props.signal.aborted) notifyResult(props, "binding.restore", false);
    } finally {
      setBusy(undefined);
    }
  };
  return (
    <ChannelShell status="implemented">
      <Stack
        fill
        gap="small"
        data-channel-conversation-detail={token}
        data-channel-conversation-tab={showBindings ? "bindings" : "messages"}
      >
        <FilterToolbar
          aria-label={copy(props.locale, showBindings ? "conversation.bindings" : "conversation.messages")}
          search={
            <SearchField
              value={query}
              onChange={setQuery}
              clearable
              clearLabel={copy(props.locale, "search.clear")}
              aria-label={copy(props.locale, showBindings ? "search.bindings" : "search.messages")}
              placeholder={copy(props.locale, showBindings ? "search.bindings" : "search.messages")}
            />
          }
          actions={
            <Button
              presentation="icon"
              disabled={loading}
              aria-label={copy(props.locale, "conversation.refresh")}
              title={copy(props.locale, "conversation.refresh")}
              onClick={() => void load()}
            >
              <Icon name="refresh" />
            </Button>
          }
        />
        <div className="cxc-channel-results" aria-busy={loading}>
          {showBindings
            ? visibleBindings.map(binding => (
              <Card key={binding.bindingToken} as="article" className="cxc-channel-local-binding">
                <Stack direction="row" align="center" wrap gap="small">
                  <Icon name="host:chat" />
                  <button
                    type="button"
                    className="cxc-channel-binding-open"
                    disabled={busy !== undefined || !props.manager.openBindingConversation}
                    onClick={() =>
                      void open(binding)}
                  >
                    {binding.sessionName}
                  </button>
                  <StatusBadge tone={binding.state === "active" ? "success" : "neutral"}>
                    {bindingLabel(props.locale, binding.state)}
                  </StatusBadge>
                  <span className="cxc-channel-binding-actions">
                    <Button
                      disabled={busy !== undefined}
                      onClick={() =>
                        setExecutionTarget(current =>
                          current === binding.bindingToken ? undefined : binding.bindingToken
                        )}
                    >
                      <Icon name="host:settings" />
                      {copy(props.locale, "binding.execution")}
                    </Button>
                    {binding.availableOperations.map(operation => (
                      <Button
                        key={operation}
                        variant={operation === "binding.unbind" ? "danger" : "secondary"}
                        disabled={busy !== undefined}
                        onClick={() => {
                          if (operation === "binding.unbind" && confirm !== binding.bindingToken) {
                            setConfirm(
                              binding.bindingToken,
                            );
                          } else void run(binding, operation);
                        }}
                      >
                        <Icon
                          name={operation === "binding.unbind"
                            ? "host:close"
                            : operation === "binding.archive"
                            ? "host:archive"
                            : "host:restore"}
                        />
                        {copy(
                          props.locale,
                          operation === "binding.unbind" && confirm === binding.bindingToken
                            ? "binding.confirm-unbind"
                            : operation,
                        )}
                      </Button>
                    ))}
                    {confirm === binding.bindingToken
                      ? (
                        <Button
                          variant="ghost"
                          onClick={() => setConfirm(undefined)}
                        >
                          {copy(props.locale, "cancel")}
                        </Button>
                      )
                      : null}
                  </span>
                </Stack>
                {executionTarget === binding.bindingToken
                  ? <BindingExecutionForm {...props} bindingToken={binding.bindingToken} />
                  : null}
              </Card>
            ))
            : visibleEntries.map(entry => (
              <Card
                key={entry.entryId}
                as="article"
                className="cxc-channel-message"
                data-direction={entry.direction}
                data-state={entry.state}
              >
                <span className="cxc-channel-message-icon">
                  <Icon name={entry.direction === "incoming" ? "host:chat" : "host:open"} />
                </span>
                <Stack gap="small" className="cxc-channel-message-copy">
                  <Stack direction="row" align="center" justify="space-between" wrap gap="small">
                    <Text as="span">
                      {entry.direction === "incoming"
                        ? entry.senderName ?? copy(props.locale, "conversation.received")
                        : entry.sessionName ?? copy(props.locale, "conversation.sent")}
                    </Text>
                    <StatusBadge
                      tone={entry.state === "sent" || entry.state === "received"
                        ? "success"
                        : entry.state === "failed" || entry.state === "denied"
                        ? "danger"
                        : entry.state === "retrying" || entry.state === "unknown"
                        ? "warning"
                        : "neutral"}
                    >
                      {copy(props.locale, `activity.${entry.state}`)}
                    </StatusBadge>
                  </Stack>
                  <Text className="cxc-channel-message-text">
                    {entry.text || copy(props.locale, "message.non-text")}
                  </Text>
                  <div className="cxc-channel-log-meta">
                    <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString(props.locale)}</time>
                    {entry.code ? <code>{entry.code}</code> : null}
                  </div>
                </Stack>
              </Card>
            ))}
          {(showBindings ? visibleBindings : visibleEntries).length === 0
            ? (
              <EmptyState
                title={copy(
                  props.locale,
                  loading
                    ? "conversation.loading"
                    : failed
                    ? "conversation.failed"
                    : needle
                    ? "messages.no-match"
                    : showBindings
                    ? "sessions.empty"
                    : "messages.empty",
                )}
              />
            )
            : null}
        </div>
        <Stack direction="row" align="center" justify="space-between" gap="small">
          <Text tone="muted">
            {copy(props.locale, showBindings ? "conversation.loaded" : "messages.local-history")}{" "}
            {(showBindings ? bindings.length : entries.length).toLocaleString(props.locale)} /{" "}
            {total.toLocaleString(props.locale)}
          </Text>
          {cursor
            ? (
              <Button disabled={loading} onClick={() => void load(cursor)}>
                {copy(props.locale, "logs.load-more")}
              </Button>
            )
            : null}
        </Stack>
      </Stack>
    </ChannelShell>
  );
}
