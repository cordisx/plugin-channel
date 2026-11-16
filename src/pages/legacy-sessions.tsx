import { Button, EmptyState, SearchField, Stack, StatusBadge } from "cordisx/ui";
import { useEffect, useRef, useState } from "cordisx/react";
import type { ChannelManagerV12 } from "@cordisx/protocol/channel-manager/v12";
import type { ChannelManagerBindingV3 } from "@cordisx/protocol/channel-manager/v2";
import type { ChannelManagerBindingDisplayV1, ChannelManagerV9 } from "@cordisx/protocol/channel-manager/v9";
import type { ChannelManagerFormMountResultV1 } from "@cordisx/protocol/channel-manager/v7";
import type { ChannelManagerV4 } from "@cordisx/protocol/channel-manager/v4";
import { bindingsForAccount, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { bindingLabel, searchText } from "../presentation.js";
import { notifyResult } from "../notifications.js";
import { ChannelShell } from "../shell.js";

export function LegacyChannelSessions(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const token = routeToken(props.params.connectionToken);
  const [loaded, setLoaded] = useState<readonly (ChannelManagerBindingV3 | ChannelManagerBindingDisplayV1)[]>();
  const [executionTarget, setExecutionTarget] = useState<string>();
  const [nextCursor, setNextCursor] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const pageLifetime = useRef<AbortController | undefined>(undefined);
  const pageManager = manager as Partial<ChannelManagerV9>;
  const bindings = loaded ?? (token === undefined ? [] : bindingsForAccount(snapshot, token));
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string>();
  const [confirm, setConfirm] = useState<string>();
  const needle = searchText(query);

  useEffect(() => {
    setLoaded(undefined);
    setNextCursor(undefined);
    if (!token || typeof pageManager.bindingPage !== "function") return;
    const lifetime = new AbortController();
    pageLifetime.current = lifetime;
    setLoading(true);
    setFailed(false);
    const read = pageManager.bindingDisplayPage?.bind(pageManager) ?? pageManager.bindingPage.bind(pageManager);
    void read({ connectionToken: token, limit: 100 }, lifetime.signal).then(page => {
      if (lifetime.signal.aborted) return;
      setLoaded(page.bindings);
      setNextCursor(page.nextCursor);
    }).catch(() => {
      if (!lifetime.signal.aborted) setFailed(true);
    })
      .finally(() => {
        if (!lifetime.signal.aborted) setLoading(false);
      });
    return () => {
      lifetime.abort();
      if (pageLifetime.current === lifetime) pageLifetime.current = undefined;
    };
  }, [manager, token, snapshot.revision]);

  const more = async () => {
    if (loading || !token || !nextCursor || typeof pageManager.bindingPage !== "function") return;
    const lifetime = pageLifetime.current;
    if (!lifetime || lifetime.signal.aborted) return;
    setLoading(true);
    try {
      const read = pageManager.bindingDisplayPage?.bind(pageManager) ?? pageManager.bindingPage.bind(pageManager);
      const page = await read(
        { connectionToken: token, afterCursor: nextCursor, limit: 100 },
        lifetime.signal,
      );
      if (lifetime.signal.aborted || lifetime !== pageLifetime.current) return;
      setLoaded(current => [...(current ?? []), ...page.bindings]);
      setNextCursor(page.nextCursor);
    } catch {
      if (!lifetime.signal.aborted && lifetime === pageLifetime.current) setFailed(true);
    } finally {
      if (!lifetime.signal.aborted && lifetime === pageLifetime.current) setLoading(false);
    }
  };
  const filtered = bindings.filter(binding =>
    searchText([
      "sessionName" in binding ? binding.sessionName : "",
      "conversationName" in binding ? binding.conversationName : "",
      bindingLabel(props.locale, binding.state),
      binding.state,
    ].join(" ")).includes(needle)
  );

  const run = async (
    binding: typeof bindings[number],
    operation: "binding.archive" | "binding.restore" | "binding.unbind",
  ) => {
    if (busy !== undefined || !binding.availableOperations.includes(operation)) return;
    setBusy(binding.bindingToken);
    try {
      const result = await manager.execute({
        ...operationFence(snapshot),
        operation,
        target: {
          kind: "binding",
          bindingToken: binding.bindingToken,
          bindingRevision: binding.bindingRevision,
        },
      });
      notifyResult(props, operation, result.status === "applied");
      if (result.status === "applied") setConfirm(undefined);
    } catch {
      notifyResult(props, operation, false);
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <ChannelShell status="implemented">
      <Stack fill gap="small" data-channel-page="detail" data-channel-detail={token}>
        <SearchField
          value={query}
          onChange={setQuery}
          clearable
          clearLabel={copy(props.locale, "search.clear")}
          placeholder={copy(props.locale, "search.bindings")}
          aria-label={copy(props.locale, "search.bindings")}
        />
        <div className="cxc-channel-results">
          {filtered.length === 0
            ? (
              <EmptyState
                title={copy(
                  props.locale,
                  failed ? "logs.failed" : loading
                    ? "logs.loading"
                    : needle === ""
                    ? "sessions.empty"
                    : "sessions.no-match",
                )}
              />
            )
            : filtered.map(binding => (
              <article key={binding.bindingToken} className="cxc-channel-binding">
                <span className="cxc-channel-binding-copy">
                  <StatusBadge tone={binding.state === "active" ? "success" : "neutral"}>
                    {bindingLabel(props.locale, binding.state)}
                  </StatusBadge>
                  <span className="cxc-channel-session-token">
                    {"sessionName" in binding && typeof binding.sessionName === "string"
                      ? binding.sessionName
                      : copy(props.locale, "binding.session")}
                  </span>
                  {"conversationName" in binding && typeof binding.conversationName === "string"
                    ? <span>{binding.conversationName}</span>
                    : null}
                </span>
                <span className="cxc-channel-actions">
                  {pageManager.mountBindingExecutionForm
                    ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setExecutionTarget(current =>
                            current === binding.bindingToken ? undefined : binding.bindingToken
                          )}
                      >
                        {props.locale.startsWith("zh") ? "执行设置" : "Execution settings"}
                      </Button>
                    )
                    : null}
                  {binding.availableOperations.map(operation => (
                    <Button
                      key={operation}
                      variant={operation === "binding.unbind" ? "danger" : "secondary"}
                      disabled={busy !== undefined}
                      onClick={() => {
                        if (operation === "binding.unbind" && confirm !== binding.bindingToken) {
                          setConfirm(binding.bindingToken);
                        } else void run(binding, operation);
                      }}
                    >
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
                      <Button variant="ghost" disabled={busy !== undefined} onClick={() => setConfirm(undefined)}>
                        {copy(props.locale, "cancel")}
                      </Button>
                    )
                    : null}
                </span>
                {executionTarget === binding.bindingToken
                  ? <BindingExecutionForm {...props} bindingToken={binding.bindingToken} />
                  : null}
              </article>
            ))}
          {nextCursor
            ? <Button disabled={loading} onClick={() => void more()}>{copy(props.locale, "logs.load-more")}</Button>
            : null}
        </div>
      </Stack>
    </ChannelShell>
  );
}

export function BindingExecutionForm(props: ChannelPageProps & { readonly bindingToken: string }) {
  const target = useRef<HTMLDivElement>(null);
  const modelsTarget = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const manager = props.manager as Partial<ChannelManagerV9>;
    if (!target.current || !manager.mountBindingExecutionForm) {
      setUnavailable(true);
      return;
    }
    const lifetime = new AbortController();
    const handles: ChannelManagerFormMountResultV1[] = [];
    const onResult = (result: { status: string }) => {
      if (!lifetime.signal.aborted) notifyResult(props, "policy.configure", result.status === "applied");
    };
    const modelManager = props.manager as Partial<ChannelManagerV12>;
    const mounts = [
      manager.mountBindingExecutionForm(props.bindingToken, target.current, { signal: lifetime.signal, onResult }),
    ];
    if (modelsTarget.current && modelManager.mountBindingModelForm) {
      mounts.push(
        modelManager.mountBindingModelForm(props.bindingToken, modelsTarget.current, {
          signal: lifetime.signal,
          onResult,
        }),
      );
    }
    void Promise.all(mounts.map(async mount => {
      const result = await mount;
      handles.push(result);
      if (lifetime.signal.aborted && result.status === "mounted") result.dispose();
      return result;
    })).then(results => {
      if (!lifetime.signal.aborted) setUnavailable(results.some(result => result.status !== "mounted"));
    }).catch(() => {
      if (!lifetime.signal.aborted) setUnavailable(true);
    });
    return () => {
      lifetime.abort();
      for (const handle of handles) if (handle.status === "mounted") handle.dispose();
    };
  }, [props.manager, props.bindingToken]);
  return (
    <div className="cxc-channel-binding-execution">
      {unavailable ? <EmptyState title={copy(props.locale, "policy.unavailable")} /> : null}
      <div ref={modelsTarget} />
      <div ref={target} />
    </div>
  );
}
