import type { ReactNode } from "cordisx/react";
import styles from "./channel.css?inline";

declare const __CORDISX_GRAPH_STYLES__: boolean | undefined;

export function ChannelShell(props: {
  readonly children: ReactNode;
  readonly status: string;
}) {
  return (
    <section
      className="cxc-channel-react"
      data-channel-manager="mounted"
      data-channel-status={props.status}
    >
      {typeof __CORDISX_GRAPH_STYLES__ !== "undefined" && __CORDISX_GRAPH_STYLES__ ? null : <style>{styles}</style>}
      {props.children}
    </section>
  );
}
