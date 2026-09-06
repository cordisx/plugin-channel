import { useState } from "cordisx/react";
import { Button, EmptyState, Stack, Text } from "cordisx/ui";
import { copy } from "../locales.js";
import { accountByToken, operationFence, routeToken, useChannelModel } from "../model.js";
import type { ChannelPageProps } from "../page-types.js";
import { ChannelShell } from "../shell.js";

export function ChannelConfiguration(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const account = accountByToken(snapshot, routeToken(props.params.connectionToken));
  const [name, setName] = useState(account?.displayName ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (account === undefined) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "accounts.empty")} />
      </ChannelShell>
    );
  }

  const run = async (
    operation: "connection.update" | "connection.enable" | "connection.disable" | "connection.reconnect",
  ) => {
    setBusy(true);
    try {
      const target = { kind: "connection" as const, connectionToken: account.connectionToken };
      const result = await manager.execute(
        operation === "connection.update"
          ? { ...operationFence(snapshot), operation, target, patch: { displayName: name.trim() } }
          : { ...operationFence(snapshot), operation, target },
      );
      setStatus(result.status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={account.connectionToken}>
        <div>
          <Text tone="muted">{copy(props.locale, "configuration.description")}</Text>
        </div>
        <label className="cxc-channel-field-control">
          <span className="cxc-channel-field-title">{copy(props.locale, "create.name")}</span>
          <input value={name} onChange={event => setName(event.currentTarget.value)} />
        </label>
        <div className="cxc-channel-actions">
          <span className="cxc-channel-note" role="status">{status}</span>
          {(["connection.enable", "connection.disable", "connection.reconnect"] as const).map(operation => (
            <Button
              key={operation}
              disabled={busy || !account.availableOperations.includes(operation)}
              onClick={() => void run(operation)}
            >
              {operation.slice("connection.".length)}
            </Button>
          ))}
          <Button
            variant="primary"
            disabled={busy || name.trim() === "" || !account.availableOperations.includes("connection.update")}
            onClick={() => void run("connection.update")}
          >
            {copy(props.locale, "configuration.save")}
          </Button>
        </div>
      </Stack>
    </ChannelShell>
  );
}
