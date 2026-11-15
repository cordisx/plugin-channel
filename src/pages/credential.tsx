import type { ChannelManagerFormMountResultV1, ChannelManagerV7 } from "@cordisx/protocol/channel-manager/v7";
import { useEffect, useRef, useState } from "cordisx/react";
import { EmptyState } from "cordisx/ui";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { notifyResult } from "../notifications.js";

/** Empty public body seat; plugin never reads Host fields or secret values. */
export function ChannelCredential(props: ChannelPageProps & { readonly connectionToken: string }) {
  const target = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const manager = props.manager as Partial<ChannelManagerV7>;
    if (!target.current || typeof manager.mountCredentialForm !== "function") {
      setUnavailable(true);
      return;
    }
    const lifetime = new AbortController();
    let handle: ChannelManagerFormMountResultV1 | undefined;
    void manager.mountCredentialForm(props.connectionToken, target.current, {
      signal: lifetime.signal,
      onResult: result => {
        if (!lifetime.signal.aborted) notifyResult(props, "connection.rotate-credential", result.status === "applied");
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
      <div ref={target} data-channel-credential-seat="true" />
    </>
  );
}
