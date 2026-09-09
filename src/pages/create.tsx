import { notifyResult } from "../notifications.js";
import { type FormEvent, useState } from "cordisx/react";
import { Button, Icon, Stack, Text } from "cordisx/ui";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { canCreateConnection, createChannelConnection, useChannelModel } from "../model.js";
import { ChannelShell } from "../shell.js";

export function ChannelCreate(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const [platform, setPlatform] = useState<"simulator" | "feishu" | "lark">("simulator");
  const [name, setName] = useState("");
  const [selectors, setSelectors] = useState<readonly ("direct" | "group")[]>(["direct"]);
  const [busy, setBusy] = useState(false);
  const available = canCreateConnection(snapshot, platform);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!available || name.trim() === "") return;
    setBusy(true);
    try {
      const result = await createChannelConnection(manager, snapshot, {
        platform,
        displayName: name.trim(),
        selectors,
      });
      if (result === "applied") {
        await props.navigation.navigate({ id: "settings" });
      } else notifyResult(props, "connection.create", false);
    } catch {
      notifyResult(props, "connection.create", false);
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
            <span className="cxc-channel-field-title">{copy(props.locale, "create.platform")}</span>
            <select value={platform} onChange={event => setPlatform(event.currentTarget.value as typeof platform)}>
              <option value="simulator">Simulator</option>
              <option value="feishu">Feishu</option>
              <option value="lark">Lark</option>
            </select>
          </label>
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
          <Button variant="primary" type="submit" disabled={busy || !available || name.trim() === ""}>
            <Icon name="success" />
            {copy(props.locale, "create.save")}
          </Button>
        </div>
      </form>
    </ChannelShell>
  );
}
