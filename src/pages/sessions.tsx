import {
  Button,
  Card,
  EmptyState,
  FilterToolbar,
  Icon,
  IdentityVisual,
  SearchField,
  Stack,
  StatusBadge,
  Text,
} from "cordisx/ui";
import { useEffect, useRef, useState } from "cordisx/react";
import type { ChannelManagerConversationV1, ChannelManagerV10 } from "@cordisx/protocol/channel-manager/v10";
import { accountByToken, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { searchText } from "../presentation.js";
import { channelPlatformIcon } from "../platform-icons.js";
import { LegacyChannelSessions } from "./legacy-sessions.js";
import { ChannelShell } from "../shell.js";

export function ChannelSessions(props: ChannelPageProps) {
  const manager = props.manager as Partial<ChannelManagerV10>;
  return typeof manager.conversationPage === "function"
    ? <ConversationList {...props} manager={manager as ChannelManagerV10} />
    : <LegacyChannelSessions {...props} />;
}

function ConversationList(props: ChannelPageProps & { readonly manager: ChannelManagerV10 }) {
  const { snapshot } = useChannelModel(props.manager);
  const token = routeToken(props.params.connectionToken);
  const account = accountByToken(snapshot, token);
  const [items, setItems] = useState<readonly ChannelManagerConversationV1[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [total, setTotal] = useState(0);
  const [complete, setComplete] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | undefined>(undefined);
  const load = async (next?: string) => {
    if (!token) return;
    request.current?.abort();
    const lifetime = new AbortController();
    request.current = lifetime;
    setLoading(true);
    try {
      const page = await props.manager.conversationPage({
        connectionToken: token,
        limit: 100,
        ...(next === undefined ? {} : { afterCursor: next }),
      }, lifetime.signal);
      if (lifetime.signal.aborted) return;
      props.conversations.adopt(page.conversations);
      setItems(current =>
        next
          ? [...new Map([...current, ...page.conversations].map(item => [item.conversationToken, item])).values()]
          : page.conversations
      );
      setCursor(page.nextCursor);
      setTotal(page.total);
      setComplete(page.directoryComplete);
      setFailed(false);
    } catch {
      if (!lifetime.signal.aborted) setFailed(true);
    } finally {
      if (!lifetime.signal.aborted) setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [props.manager, token, snapshot.revision]);
  const needle = searchText(query);
  const filtered = items.filter(item =>
    searchText([item.name, copy(props.locale, `conversation.kind.${item.kind}`)].join(" ")).includes(needle)
  );
  return (
    <ChannelShell status="implemented">
      <Stack fill gap="small" data-channel-conversations={token}>
        <FilterToolbar
          aria-label={copy(props.locale, "conversations")}
          search={
            <SearchField
              value={query}
              onChange={setQuery}
              clearable
              clearLabel={copy(props.locale, "search.clear")}
              placeholder={copy(props.locale, "search.conversations")}
              aria-label={copy(props.locale, "search.conversations")}
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
          {filtered.map(item => (
            <Card key={item.conversationToken} as="article" className="cxc-channel-conversation-card">
              <button
                type="button"
                className="cxc-channel-conversation-open"
                onClick={() =>
                  void props.navigation.navigate({
                    id: "conversation-messages",
                    params: { connectionToken: item.connectionToken, conversationToken: item.conversationToken },
                  })}
              >
                <IdentityVisual
                  icon={channelPlatformIcon(account?.adapterKind ?? "feishu")}
                  {...(item.avatar === undefined ? {} : { avatar: item.avatar })}
                />
                <Stack gap="small" className="cxc-channel-conversation-copy">
                  <Stack direction="row" align="center" wrap gap="small">
                    <Text as="span" className="cxc-channel-conversation-name">{item.name}</Text>
                    <StatusBadge tone="neutral">{copy(props.locale, `conversation.kind.${item.kind}`)}</StatusBadge>
                  </Stack>
                  <div className="cxc-channel-conversation-meta">
                    <span>
                      <Icon name="relationship" />
                      {copy(props.locale, "conversation.bindings")} {item.bindingCount.toLocaleString(props.locale)}
                    </span>
                    <span>
                      <Icon name="host:chat" />
                      {copy(props.locale, "conversation.received")} {item.receivedCount.toLocaleString(props.locale)}
                    </span>
                    <span>
                      <Icon name="host:open" />
                      {copy(props.locale, "conversation.sent")} {item.sentCount.toLocaleString(props.locale)}
                    </span>
                    {item.lastActivityAt
                      ? (
                        <time dateTime={item.lastActivityAt}>
                          {new Date(item.lastActivityAt).toLocaleString(props.locale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      )
                      : null}
                  </div>
                </Stack>
                <Icon name="host:chevron-right" />
              </button>
            </Card>
          ))}
          {filtered.length === 0
            ? (
              <EmptyState
                title={copy(
                  props.locale,
                  loading
                    ? "conversation.loading"
                    : failed
                    ? "conversation.failed"
                    : items.length === 0
                    ? "conversations.empty"
                    : "conversations.no-match",
                )}
              />
            )
            : null}
        </div>
        <Stack direction="row" align="center" justify="space-between" gap="small">
          <Text tone="muted">
            {copy(props.locale, complete ? "conversation.loaded" : "conversation.partial")}{" "}
            {items.length.toLocaleString(props.locale)} / {total.toLocaleString(props.locale)}
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
