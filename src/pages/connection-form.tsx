import type { ChannelManagerV8 } from "@cordisx/protocol/channel-manager/v8";
import type { ChannelManagerFormMountResultV1 } from "@cordisx/protocol/channel-manager/v7";
import { useEffect, useRef, useState } from "cordisx/react";
import { Button, EmptyState } from "cordisx/ui";
import { copy } from "../locales.js";
import { notifyResult } from "../notifications.js";
import { mountConnectionFormWithRetry } from "../connection-form-mount.js";
import type { ChannelPageProps } from "../page-types.js";

/** Empty body seat. Host owns all five fields, one draft and one transaction. */
export function ChannelConnectionConfigurationForm(props: ChannelPageProps & { readonly connectionToken: string }) {
  const target = useRef<HTMLDivElement>(null), [unavailable, setUnavailable] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const manager = props.manager as ChannelManagerV8;
    if (!target.current) return;
    const lifetime = new AbortController();
    let handle: ChannelManagerFormMountResultV1 | undefined;
    void mountConnectionFormWithRetry(
      options => manager.mountConnectionConfigurationForm(props.connectionToken, target.current!, options),
      {
        signal: lifetime.signal,
        onResult: outcome => {
          // The Host shows this validation beside the tenant field; a second
          // floating error would obscure the form's retry controls.
          if (!lifetime.signal.aborted && !(outcome.status === "rejected" && outcome.code === "TENANT_MISMATCH")) {
            notifyResult(props, "connection.update", outcome.status === "applied", outcome.code);
          }
        },
      },
    ).then(result => {
      handle = result;
      if (lifetime.signal.aborted) {
        if (result?.status === "mounted") result.dispose();
        return;
      }
      setUnavailable(
        result?.status === "unavailable"
          ? (/^[A-Z0-9_]{1,80}$/u.test(result.code) ? result.code : "FORM_UNAVAILABLE")
          : undefined,
      );
    });
    return () => {
      lifetime.abort();
      if (handle?.status === "mounted") handle.dispose();
    };
  }, [props.manager, props.connectionToken, attempt]);
  return (
    <>
      {unavailable
        ? (
          <EmptyState
            title={copy(props.locale, "configuration.form-unavailable")}
            action={
              <Button
                onClick={() => {
                  setUnavailable(undefined);
                  setAttempt(value => value + 1);
                }}
              >
                {copy(props.locale, "configuration.retry")}
              </Button>
            }
          />
        )
        : null}
      <div ref={target} data-channel-connection-form-seat="true" data-channel-form-error={unavailable} />
    </>
  );
}
