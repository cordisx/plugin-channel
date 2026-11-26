import type { Context, Disposable } from "@deepseek-ai/cordis";
import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";
import type { CordisXMessageDefinition, CordisXMessageSchema, CordisXPageMount } from "cordisx/contracts";
import { accountByToken, operationFence, routeToken } from "./model.js";
import { copy } from "./locales.js";

function toggleOperation(account: ReturnType<typeof accountByToken>): "connection.enable" | "connection.disable" {
  const canEnable = account?.availableOperations.includes("connection.enable") ?? false;
  const canDisable = account?.availableOperations.includes("connection.disable") ?? false;
  if (canEnable !== canDisable) return canEnable ? "connection.enable" : "connection.disable";
  return account?.connectionState === "disabled" ? "connection.enable" : "connection.disable";
}

/** Header commands are owned by this exact live page, using Host-supplied route params. */
export function withConfigurationHeader<Messages extends CordisXMessageDefinition<Messages> = CordisXMessageSchema>(
  ctx: Context,
  manager: ChannelManagerV2,
  mount: CordisXPageMount<Messages>,
  allowReconnect = true,
): CordisXPageMount<Messages> {
  return page => {
    const token = routeToken(page.params.connectionToken);
    const handlers = new Map<string, Disposable<void | Promise<void>>>();
    let closed = false, busy = false;
    const run = async (action: "toggle" | "reconnect") => {
      if (closed || busy || page.signal.aborted) return;
      const snapshot = manager.snapshot(), account = accountByToken(snapshot, token);
      if (!account) return;
      const operation = action === "reconnect" ? "connection.reconnect" : toggleOperation(account);
      if (!account.availableOperations.includes(operation)) return;
      busy = true;
      let applied = false;
      try {
        const result = await manager.execute({
          ...operationFence(snapshot),
          operation,
          target: { kind: "connection", connectionToken: account.connectionToken },
        });
        applied = result.status === "applied";
      } catch {
        /* The public notification carries safe operation feedback. */
      } finally {
        busy = false;
      }
      if (!closed && !page.signal.aborted) {
        ctx.notifications.show({
          kind: applied ? "channel.operation.saved" : "channel.operation.failed",
          type: applied ? "success" : "error",
          message: copy(page.localization.getSnapshot().locale, applied ? "operation.saved" : "operation.failed"),
        });
      }
    };
    const refresh = () => {
      if (closed || page.signal.aborted) return;
      const account = accountByToken(manager.snapshot(), token);
      const toggle = toggleOperation(account);
      page.controls.setHeaderActionLabel("connection-toggle", { namespace: "channel", key: toggle }, {
        namespace: "channel",
        key: toggle,
      });
      for (
        const [id, operation, action] of [
          ["toggle-connection", toggle, "toggle"],
          ["reconnect-connection", "connection.reconnect", "reconnect"],
        ] as const
      ) {
        const available = (action !== "reconnect" || allowReconnect)
          && (account?.availableOperations.includes(operation) ?? false);
        if (!available) {
          void handlers.get(id)?.();
          handlers.delete(id);
        } else if (!handlers.has(id)) {
          handlers.set(
            id,
            ctx.commands.register({
              id,
              title: { namespace: "channel", key: operation },
            }, () => run(action)),
          );
        }
      }
    };
    const dispose = () => {
      if (closed) return;
      closed = true;
      subscription.dispose();
      for (const handler of handlers.values()) void handler();
      handlers.clear();
      page.signal.removeEventListener("abort", dispose);
    };
    const subscription = manager.subscribe(refresh);
    page.signal.addEventListener("abort", dispose, { once: true });
    try {
      refresh();
      const unmount = mount(page);
      return () => {
        dispose();
        unmount?.();
      };
    } catch (error) {
      dispose();
      throw error;
    }
  };
}
