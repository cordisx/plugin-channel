import { notifyResult } from "../notifications.js";
import { type FormEvent, useMemo, useState } from "cordisx/react";
import { Button, EmptyState, SchemaForm, Text } from "cordisx/ui";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import {
  availablePlatforms,
  canCreateConnection,
  createChannelConnection,
  receiveSelectors,
  useChannelModel,
} from "../model.js";
import { type ChannelPlatform, createSchema } from "../forms.js";
import { ChannelShell } from "../shell.js";

export function ChannelCreate(props: ChannelPageProps) {
  const { manager, snapshot } = useChannelModel(props.manager);
  const platforms = availablePlatforms(snapshot).filter(platform =>
    !props.configurationOnly || platform !== "simulator"
  );
  const simulator = platforms.includes("simulator");
  const credentialed = platforms.includes("feishu");
  const schema = useMemo(() => createSchema(props.locale, platforms), [props.locale, simulator, credentialed]);
  const [draft, setDraft] = useState<Record<string, unknown>>({
    platform: platforms[0] ?? "simulator",
    displayName: "",
    groupMode: "mentions",
  });
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = typeof draft.displayName === "string" ? draft.displayName.trim() : "";
  const platform = draft.platform as ChannelPlatform;
  const available = platforms.includes(platform) && canCreateConnection(snapshot, platform);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !valid || !available || name === "") return;
    setBusy(true);
    try {
      const result = await createChannelConnection(manager, snapshot, {
        platform,
        displayName: name,
        selectors: receiveSelectors(draft.groupMode),
      });
      if (result === "applied") {
        await props.navigation.navigate({ id: "settings" });
      } else if (result !== "cancelled") notifyResult(props, "connection.create", false);
    } catch {
      notifyResult(props, "connection.create", false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelShell status={available ? "implemented" : "unavailable"}>
      {platforms.length === 0
        ? <EmptyState title={copy(props.locale, "create.unavailable")} />
        : (
          <form className="cxc-channel-form" data-channel-page="create" onSubmit={event => void submit(event)}>
            <SchemaForm
              identity="channel-create"
              schema={schema}
              value={draft}
              locale={props.locale}
              disabled={busy}
              onChange={next => {
                setDraft({ ...next.value });
                setValid(next.valid);
              }}
              onValidationChange={next => setValid(next.valid)}
            />
            {platform !== "simulator" ? <Text tone="muted">{copy(props.locale, "credential.create.help")}</Text> : null}
            <div className="cxc-channel-actions">
              <Button
                variant="primary"
                type="submit"
                disabled={busy || !valid || !available || name === ""}
              >
                {copy(props.locale, "create.save")}
              </Button>
            </div>
          </form>
        )}
    </ChannelShell>
  );
}
