import { Card, EmptyState, Stack } from "cordisx/ui";
import { copy } from "../locales.js";
import { accountByToken, routeToken, stateLabel, useChannelModel } from "../model.js";
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
  const stats = [
    [copy(props.locale, "status.state"), stateLabel(props.locale, account.connectionState)],
    [copy(props.locale, "status.inbound"), String(account.inbound.pending + account.inbound.retrying)],
    [copy(props.locale, "status.outbound"), String(account.outbound.pending + account.outbound.retrying)],
    [copy(props.locale, "status.generation"), String(account.generation)],
  ];
  return (
    <ChannelShell status={account.implementationStatus}>
      <Stack gap="medium" data-channel-page="detail" data-channel-detail={account.connectionToken}>
        <div className="cxc-channel-cards">
          {stats.map(([label, value]) => (
            <Card key={label} className="cxc-channel-stat">
              <strong>{value}</strong>
              <span>{label}</span>
            </Card>
          ))}
        </div>
      </Stack>
    </ChannelShell>
  );
}
