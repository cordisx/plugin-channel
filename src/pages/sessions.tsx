import { Button, EmptyState, SearchField, Stack, StatusBadge } from "cordisx/ui";
import { useState } from "cordisx/react";
import { bindingsForAccount, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { bindingLabel, searchText } from "../presentation.js";
import { notifyResult } from "../notifications.js";
import { ChannelShell } from "../shell.js";

export function ChannelSessions(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const token = routeToken(props.params.connectionToken);
  const bindings = token === undefined ? [] : bindingsForAccount(snapshot, token);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string>();
  const [confirm, setConfirm] = useState<string>();
  const needle = searchText(query);
  const filtered = bindings.filter(binding =>
    searchText([
      binding.sessionToken,
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
            ? <EmptyState title={copy(props.locale, needle === "" ? "sessions.empty" : "sessions.no-match")} />
            : filtered.map(binding => (
              <article key={binding.bindingToken} className="cxc-channel-binding">
                <span className="cxc-channel-binding-copy">
                  <StatusBadge tone={binding.state === "active" ? "success" : "neutral"}>
                    {bindingLabel(props.locale, binding.state)}
                  </StatusBadge>
                  <span className="cxc-channel-session-token" title={binding.sessionToken}>
                    {copy(props.locale, "binding.session")} · {binding.sessionToken}
                  </span>
                </span>
                <span className="cxc-channel-actions">
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
              </article>
            ))}
        </div>
      </Stack>
    </ChannelShell>
  );
}
