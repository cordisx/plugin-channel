import type { ChannelManagerV11, ChannelSettingsFormSectionV1 } from "@cordisx/protocol/channel-manager/v11";
import type { ChannelManagerFormMountResultV1 } from "@cordisx/protocol/channel-manager/v7";
import { useEffect, useRef, useState } from "cordisx/react";
import { EmptyState } from "cordisx/ui";
import type { ChannelPageProps } from "../page-types.js";
import { copy } from "../locales.js";
import { notifyResult } from "../notifications.js";
import { ChannelShell } from "../shell.js";

export function ChannelPolicy(props: ChannelPageProps & { readonly settingsSection?: ChannelSettingsFormSectionV1 }) {
  const target = useRef<HTMLDivElement>(null);
  const defaults = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const manager = props.manager as Partial<ChannelManagerV11>;
    if (props.settingsSection) {
      if (!target.current || typeof manager.mountSettingsForm !== "function") {
        setUnavailable(true);
        return;
      }
      const lifetime = new AbortController();
      let handle: ChannelManagerFormMountResultV1 | undefined;
      void manager.mountSettingsForm(props.settingsSection, target.current, {
        signal: lifetime.signal,
        onResult: result => {
          if (!lifetime.signal.aborted) notifyResult(props, "settings.title", result.status === "applied");
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
    }
    if (!target.current || typeof manager.mountConversationReplyPolicyForm !== "function") {
      setUnavailable(true);
      return;
    }
    const lifetime = new AbortController();
    let handle: ChannelManagerFormMountResultV1 | undefined;
    const mount = manager.mountConversationWorkflowPolicyForm?.bind(manager)
      ?? manager.mountConversationReplyPolicyForm.bind(manager);
    void mount(target.current, {
      signal: lifetime.signal,
      onResult: result => {
        if (!lifetime.signal.aborted) notifyResult(props, "policy.configure", result.status === "applied");
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
    let defaultsHandle: ChannelManagerFormMountResultV1 | undefined;
    if (defaults.current && manager.mountChatCreationDefaultsForm) {
      void manager.mountChatCreationDefaultsForm(defaults.current, {
        signal: lifetime.signal,
        onResult: result => {
          if (!lifetime.signal.aborted) notifyResult(props, "policy.configure", result.status === "applied");
        },
      }).then(result => {
        defaultsHandle = result;
        if (lifetime.signal.aborted && result.status === "mounted") {
          result.dispose();
        }
      }).catch(() => {
        if (!lifetime.signal.aborted) setUnavailable(true);
      });
    }
    return () => {
      lifetime.abort();
      if (defaultsHandle?.status === "mounted") defaultsHandle.dispose();
      if (handle?.status === "mounted") handle.dispose();
    };
  }, [props.manager, props.settingsSection]);
  return (
    <ChannelShell status={unavailable ? "unavailable" : "available"}>
      {unavailable ? <EmptyState title={copy(props.locale, "policy.unavailable")} /> : null}
      {props.settingsSection
        ? null
        : <div ref={defaults} className="cxc-channel-policy-seat" data-channel-execution-defaults="true" />}
      <div ref={target} className="cxc-channel-policy-seat" data-channel-policy-page="true" />
    </ChannelShell>
  );
}
