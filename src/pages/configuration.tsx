import type { ChannelManagerAccountV3, ChannelManagerSnapshotV3 } from "@cordisx/protocol/channel-manager/v2";
import { useEffect, useMemo, useRef, useState } from "cordisx/react";
import { Button, EmptyState, Icon, SchemaForm, Stack, StatusBadge, Text } from "cordisx/ui";
import { copy } from "../locales.js";
import { configurationSchema } from "../forms.js";
import { accountByToken, operationFence, routeToken, stateLabel, useChannelModel } from "../model.js";
import { notifyResult } from "../notifications.js";
import { platformLabel, stateTone } from "../presentation.js";
import type { ChannelPageProps } from "../page-types.js";
import { ChannelShell } from "../shell.js";

export function ChannelConfiguration(props: ChannelPageProps) {
  const { snapshot } = useChannelModel(props.manager);
  const account = accountByToken(snapshot, routeToken(props.params.connectionToken));
  if (account === undefined) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "accounts.empty")} />
      </ChannelShell>
    );
  }
  return <ConnectionConfiguration key={account.connectionToken} {...props} account={account} snapshot={snapshot} />;
}

function ConnectionConfiguration(
  props: ChannelPageProps & {
    readonly account: ChannelManagerAccountV3;
    readonly snapshot: ChannelManagerSnapshotV3;
  },
) {
  const { account, snapshot } = props;
  const schema = useMemo(() => configurationSchema(props.locale), [props.locale]);
  const [draft, setDraft] = useState<Record<string, unknown>>({ displayName: account.displayName ?? "" });
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastName = useRef(account.displayName ?? "");
  const name = typeof draft.displayName === "string" ? draft.displayName.trim() : "";
  const dirty = name !== (account.displayName ?? "").trim();
  const writable = account.availableOperations.includes("connection.update");
  const toggle = account.connectionState === "disabled" ? "connection.enable" : "connection.disable";

  useEffect(() => {
    const previous = lastName.current;
    const next = account.displayName ?? "";
    setDraft(current => current.displayName === previous ? { displayName: next } : current);
    lastName.current = next;
  }, [account.displayName]);

  const run = async (
    operation: "connection.update" | "connection.enable" | "connection.disable" | "connection.reconnect",
  ) => {
    if (busy || !account.availableOperations.includes(operation)) return;
    if (operation === "connection.update" && (!valid || name === "" || !dirty)) return;
    setBusy(true);
    try {
      const target = { kind: "connection" as const, connectionToken: account.connectionToken };
      const result = await props.manager.execute(
        operation === "connection.update"
          ? { ...operationFence(snapshot), operation, target, patch: { displayName: name } }
          : { ...operationFence(snapshot), operation, target },
      );
      notifyResult(props, operation, result.status === "applied");
    } catch {
      notifyResult(props, operation, false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={account.connectionToken}>
        <Stack direction="row" align="center" justify="space-between" wrap gap="small">
          <Stack direction="row" align="center" gap="small">
            <StatusBadge tone={stateTone(account.connectionState)}>
              {stateLabel(props.locale, account.connectionState)}
            </StatusBadge>
            <Text tone="muted">{platformLabel(props.locale, account.adapterKind)}</Text>
          </Stack>
          <Stack direction="row" gap="small">
            <Button disabled={busy || !account.availableOperations.includes(toggle)} onClick={() => void run(toggle)}>
              {copy(props.locale, toggle === "connection.enable" ? "connection.enable" : "connection.disable")}
            </Button>
            <Button
              aria-label={copy(props.locale, "connection.reconnect")}
              title={copy(props.locale, "connection.reconnect")}
              disabled={busy || !account.availableOperations.includes("connection.reconnect")}
              onClick={() => void run("connection.reconnect")}
            >
              <Icon name="refresh" />
            </Button>
          </Stack>
        </Stack>
        <form
          className="cxc-channel-form"
          onSubmit={event => {
            event.preventDefault();
            void run("connection.update");
          }}
        >
          <SchemaForm
            identity={account.connectionToken}
            schema={schema}
            value={draft}
            locale={props.locale}
            disabled={busy || !writable}
            onChange={next => {
              setDraft({ ...next.value });
              setValid(next.valid);
            }}
            onValidationChange={next => setValid(next.valid)}
          />
          <div className="cxc-channel-actions">
            <Button variant="primary" type="submit" disabled={busy || !valid || !dirty || !writable || name === ""}>
              {copy(props.locale, "configuration.save")}
            </Button>
          </div>
        </form>
      </Stack>
    </ChannelShell>
  );
}
