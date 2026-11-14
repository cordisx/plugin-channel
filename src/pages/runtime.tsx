import { Disclosure, EmptyState, FieldList, Stack, StatusBadge } from "cordisx/ui";
import { copy } from "../locales.js";
import { accountByToken, routeToken, stateLabel, useChannelModel } from "../model.js";
import { configurationLabel, stateTone } from "../presentation.js";
import type { ChannelPageProps } from "../page-types.js";
import { ChannelShell } from "../shell.js";

export function ChannelRuntime(props: ChannelPageProps) {
  const { snapshot } = useChannelModel(props.manager);
  const account = accountByToken(snapshot, routeToken(props.params.connectionToken));
  if (account === undefined) {
    return (
      <ChannelShell status="unavailable">
        <EmptyState title={copy(props.locale, "accounts.empty")} />
      </ChannelShell>
    );
  }
  const queueItems = [
    {
      id: "inbound",
      label: copy(props.locale, "status.inbound"),
      value: account.inbound.pending + account.inbound.retrying,
    },
    {
      id: "outbound",
      label: copy(props.locale, "status.outbound"),
      value: account.outbound.pending + account.outbound.retrying,
    },
    { id: "inbound-failed", label: copy(props.locale, "status.inbound-failed"), value: account.inbound.deadLetter },
    { id: "outbound-failed", label: copy(props.locale, "status.outbound-failed"), value: account.outbound.deadLetter },
  ];
  const diagnostics = [
    { id: "generation", label: copy(props.locale, "status.generation"), value: account.generation },
    { id: "revision", label: copy(props.locale, "status.revision"), value: account.lastGoodRevision },
    ...(account.cursorUpdatedAt === undefined ? [] : [{
      id: "cursor",
      label: copy(props.locale, "status.cursor"),
      value: new Date(account.cursorUpdatedAt).toLocaleString(props.locale),
    }]),
    ...(account.lastErrorCode === undefined ? [] : [{
      id: "error",
      label: copy(props.locale, "status.error"),
      value: account.lastErrorCode,
    }]),
  ];
  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={account.connectionToken}>
        <FieldList
          density="compact"
          items={[
            {
              id: "state",
              label: copy(props.locale, "status.state"),
              value: (
                <StatusBadge tone={stateTone(account.connectionState)}>
                  {stateLabel(props.locale, account.connectionState)}
                </StatusBadge>
              ),
            },
            {
              id: "configuration",
              label: copy(props.locale, "status.configuration"),
              value: configurationLabel(props.locale, account.configurationState),
            },
            ...queueItems,
          ]}
        />
        <Disclosure summary={copy(props.locale, "diagnostics")}>
          <FieldList density="compact" items={diagnostics} />
        </Disclosure>
      </Stack>
    </ChannelShell>
  );
}
