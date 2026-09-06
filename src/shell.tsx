import type { ReactNode } from "cordisx/react";
import styles from "./channel.css";

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
      <style>{styles}</style>
      {props.children}
    </section>
  );
}
