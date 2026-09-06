import { Button, Card, EmptyState, Stack } from "cordisx/ui";
import { useState } from "cordisx/react";
import { bindingsForAccount, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { ChannelShell } from "../shell.js";

export function ChannelSessions(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const token = routeToken(props.params.connectionToken);
  const bindings = token === undefined ? [] : bindingsForAccount(snapshot, token);
  const [busy, setBusy] = useState(false);
  if (bindings.length === 0) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "sessions.empty")} />
      </ChannelShell>
    );
  }

  const run = async (
    binding: typeof bindings[number],
    operation: "binding.archive" | "binding.restore" | "binding.unbind",
  ) => {
    setBusy(true);
    try {
      await manager.execute({
        ...operationFence(snapshot),
        operation,
        target: {
          kind: "binding",
          bindingToken: binding.bindingToken,
          bindingRevision: binding.bindingRevision,
        },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelShell status="implemented">
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={token}>
        <div className="cxc-channel-data-list">
          {bindings.map(binding => (
            <Card key={binding.bindingToken} className="cxc-channel-data-row">
              <span className="cxc-channel-data-copy">
                <strong>{binding.state}</strong>
                <span className="cxc-channel-meta">Revision {binding.bindingRevision}</span>
              </span>
              <span className="cxc-channel-actions">
                {binding.availableOperations.map(operation => (
                  <Button
                    key={operation}
                    disabled={busy}
                    onClick={() => void run(binding, operation)}
                  >
                    {operation.slice("binding.".length)}
                  </Button>
                ))}
              </span>
            </Card>
          ))}
        </div>
      </Stack>
    </ChannelShell>
  );
}
