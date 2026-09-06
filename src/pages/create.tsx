import { type FormEvent, useState } from "cordisx/react";
import { Button, Icon, Stack, Text } from "cordisx/ui";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { operationFence, targetFence, useChannelModel } from "../model.js";
import { ChannelShell } from "../shell.js";

export function ChannelCreate(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const [name, setName] = useState("");
  const [selectors, setSelectors] = useState<readonly ("direct" | "group")[]>(["direct"]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const available = snapshot.availableOperations.includes("target.connection.create.simulator");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!available || name.trim() === "") return;
    setBusy(true);
    try {
      const issued = await manager.issue({
        ...targetFence(snapshot),
        operation: "target.connection.create.simulator",
        adapterKind: "simulator",
        target: { kind: "root" },
      });
      if (
        issued.status !== "applied" || issued.operation !== "target.connection.create.simulator"
        || issued.target.kind !== "connection-draft"
      ) {
        setStatus(copy(props.locale, "create.unavailable"));
        return;
      }
      const result = await manager.execute({
        ...operationFence(snapshot),
        operation: "connection.create",
        target: issued.target,
        draft: { displayName: name.trim(), selectors },
      });
      if (result.status === "applied") {
        await props.navigation.navigate({ id: "settings" });
      } else setStatus(copy(props.locale, "create.unavailable"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelShell status={available ? "implemented" : "unavailable"}>
      <form className="cxc-channel-form" data-channel-page="create" onSubmit={event => void submit(event)}>
        <Stack gap="medium">
          <Text tone="muted">{copy(props.locale, "create.description")}</Text>
          <label className="cxc-channel-field-control">
            <span className="cxc-channel-field-title">{copy(props.locale, "create.name")}</span>
            <input required value={name} onChange={event => setName(event.currentTarget.value)} />
          </label>
          <label className="cxc-channel-switch">
            <input
              type="checkbox"
              checked={selectors.includes("group")}
              onChange={event => setSelectors(event.currentTarget.checked ? ["direct", "group"] : ["direct"])}
            />
            {copy(props.locale, "create.groups")}
          </label>
        </Stack>
        <div className="cxc-channel-actions">
          <span className="cxc-channel-note" role="status">{status}</span>
          <Button variant="primary" type="submit" disabled={busy || !available || name.trim() === ""}>
            <Icon name="success" />
            {copy(props.locale, "create.save")}
          </Button>
        </div>
      </form>
    </ChannelShell>
  );
}
