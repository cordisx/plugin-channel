import type { ChannelManagerV7 } from "@cordisx/protocol/channel-manager/v7";
import type { ChannelManagerV8 } from "@cordisx/protocol/channel-manager/v8";
import { ChannelConnectionConfigurationForm } from "./connection-form.js";
import { ChannelCredential } from "./credential.js";
import type { ChannelManagerAccountV3, ChannelManagerSnapshotV3 } from "@cordisx/protocol/channel-manager/v2";
import type { ChannelManagerConnectionConfigurationV1, ChannelManagerV4 } from "@cordisx/protocol/channel-manager/v4";
import { useEffect, useMemo, useRef, useState } from "cordisx/react";
import { Button, EmptyState, SchemaForm, Stack, StatusBadge, Text } from "cordisx/ui";
import { copy } from "../locales.js";
import { configurationSchema } from "../forms.js";
import {
  accountByToken,
  operationFence,
  receiveSelectors,
  rotateChannelCredential,
  routeToken,
  stateLabel,
  useChannelModel,
} from "../model.js";
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
  if (typeof (props.manager as Partial<ChannelManagerV8>).mountConnectionConfigurationForm === "function") {
    return (
      <ChannelShell status={account.implementationStatus}>
        <ChannelConnectionConfigurationForm
          key={`${account.connectionToken}:${
            account.lastErrorCode === "TENANT_IDENTIFICATION_PENDING" ? "pending" : "resolved"
          }`}
          {...props}
          connectionToken={account.connectionToken}
        />
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
  const manager = props.manager as Partial<ChannelManagerV4>;
  const [configuration, setConfiguration] = useState<ChannelManagerConnectionConfigurationV1>();
  const schema = useMemo(() => configurationSchema(props.locale, configuration !== undefined), [
    props.locale,
    configuration !== undefined,
  ]);
  const [draft, setDraft] = useState<Record<string, unknown>>({ displayName: account.displayName ?? "" });
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastName = useRef(account.displayName ?? "");
  const lastGroupMode = useRef<string | undefined>(undefined);
  const operationLifetime = useRef(new AbortController());
  const name = typeof draft.displayName === "string" ? draft.displayName.trim() : "";
  const groupMode = configuration?.selectors.includes("group")
    ? "all"
    : configuration?.selectors.includes("mentions")
    ? "mentions"
    : "none";
  const dirty = name !== (account.displayName ?? "").trim()
    || configuration !== undefined && draft.groupMode !== groupMode;
  const writable = account.availableOperations.includes("connection.update");

  useEffect(() => {
    const lifetime = new AbortController();
    operationLifetime.current = lifetime;
    return () => lifetime.abort();
  }, []);

  useEffect(() => {
    if (typeof manager.connectionConfiguration !== "function") return;
    const lifetime = new AbortController();
    void manager.connectionConfiguration(account.connectionToken, lifetime.signal).then(value => {
      if (lifetime.signal.aborted) return;
      setConfiguration(value);
      const previous = lastGroupMode.current;
      const next = value.selectors.includes("group")
        ? "all"
        : value.selectors.includes("mentions")
        ? "mentions"
        : "none";
      setDraft(current =>
        current.groupMode === undefined || current.groupMode === previous
          ? { ...current, groupMode: next }
          : current
      );
      lastGroupMode.current = next;
    }).catch(() => {});
    return () => lifetime.abort();
  }, [props.manager, account.connectionToken, snapshot.hostGeneration, snapshot.revision]);

  useEffect(() => {
    const previous = lastName.current;
    const next = account.displayName ?? "";
    setDraft(current => current.displayName === previous ? { ...current, displayName: next } : current);
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
          ? {
            ...operationFence(snapshot),
            operation,
            target,
            patch: {
              displayName: name,
              ...(configuration === undefined ? {} : { selectors: receiveSelectors(draft.groupMode) }),
            },
          }
          : { ...operationFence(snapshot), operation, target },
      );
      if (operationLifetime.current.signal.aborted) return;
      if (result.status === "applied" && operation === "connection.update" && configuration !== undefined) {
        setConfiguration({
          ...configuration,
          displayName: name,
          selectors: receiveSelectors(draft.groupMode),
          revision: result.revision,
        });
      }
      notifyResult(props, operation, result.status === "applied");
    } catch {
      if (!operationLifetime.current.signal.aborted) notifyResult(props, operation, false);
    } finally {
      if (!operationLifetime.current.signal.aborted) setBusy(false);
    }
  };

  const replaceCredential = async () => {
    if (busy || !account.availableOperations.includes("target.credential.capture.rotate")) return;
    setBusy(true);
    try {
      const result = await rotateChannelCredential(props.manager, snapshot, account);
      if (operationLifetime.current.signal.aborted) return;
      // Cancellation is an intentional no-op; no error toast for a dismissed Host prompt.
      if (result !== "cancelled") notifyResult(props, "connection.rotate-credential", result === "applied");
    } catch {
      if (!operationLifetime.current.signal.aborted) notifyResult(props, "connection.rotate-credential", false);
    } finally {
      if (!operationLifetime.current.signal.aborted) setBusy(false);
    }
  };

  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={account.connectionToken}>
        <Stack direction="row" align="center" justify="space-between" wrap gap="small">
          {props.summaryAvailable ? null : (
            <Stack direction="row" align="center" gap="small">
              <StatusBadge tone={stateTone(account.connectionState)}>
                {stateLabel(props.locale, account.connectionState)}
              </StatusBadge>
              <Text tone="muted">{platformLabel(props.locale, account.adapterKind)}</Text>
            </Stack>
          )}
        </Stack>
        {typeof (props.manager as Partial<ChannelManagerV7>).mountCredentialForm === "function"
          ? <ChannelCredential {...props} connectionToken={account.connectionToken} />
          : (
            <Stack direction="row" align="center" justify="space-between" wrap gap="small">
              <Text tone="muted">{copy(props.locale, "credential.fields")}</Text>
              <Button
                disabled={busy || !account.availableOperations.includes("target.credential.capture.rotate")}
                onClick={() => void replaceCredential()}
              >
                {copy(props.locale, "credential.replace")}
              </Button>
            </Stack>
          )}
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
