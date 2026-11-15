import type { ChannelManagerV8 } from "@cordisx/protocol/channel-manager/v8";
import type { ChannelManagerFormMountResultV1 } from "@cordisx/protocol/channel-manager/v7";
import { useEffect, useRef, useState } from "cordisx/react";
import { EmptyState } from "cordisx/ui";
import { copy } from "../locales.js";
import { notifyResult } from "../notifications.js";
import type { ChannelPageProps } from "../page-types.js";

/** Empty body seat. Host owns all five fields, one draft and one transaction. */
export function ChannelConnectionConfigurationForm(props: ChannelPageProps & { readonly connectionToken: string }) {
  const target = useRef<HTMLDivElement>(null), [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const manager = props.manager as ChannelManagerV8;
    if (!target.current) return;
    const lifetime = new AbortController();
    let handle: ChannelManagerFormMountResultV1 | undefined;
    void manager.mountConnectionConfigurationForm(props.connectionToken, target.current, {
      signal: lifetime.signal,
      onResult: result => {
        if (!lifetime.signal.aborted) notifyResult(props, "connection.update", result.status === "applied");
      },
    }).then(result => {
      handle = result;
      if (lifetime.signal.aborted) {
        if (result.status === "mounted") result.dispose();
        return;
      }
      setUnavailable(result.status !== "mounted");
    }).catch(() => {
      if (!lifetime.signal.aborted) setUnavailable(true);
    });
    return () => {
      lifetime.abort();
      if (handle?.status === "mounted") handle.dispose();
    };
  }, [props.manager, props.connectionToken]);
  return (
    <>
      {unavailable ? <EmptyState title={copy(props.locale, "credential.unavailable")} /> : null}
      <div ref={target} data-channel-connection-form-seat="true" />
    </>
  );
}
