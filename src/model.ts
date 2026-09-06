import type {
  ChannelManagerAccountV3,
  ChannelManagerBindingV3,
  ChannelManagerSnapshotV3,
  ChannelManagerV2,
} from "@cordisx/protocol/channel-manager/v2";
import { useSyncExternalStore } from "cordisx/react";

export interface ChannelPageModel {
  readonly manager: ChannelManagerV2;
  readonly snapshot: ChannelManagerSnapshotV3;
}

export function useChannelModel(manager: ChannelManagerV2): ChannelPageModel {
  return {
    manager,
    snapshot: useSyncExternalStore(
      listener => {
        const subscription = manager.subscribe(listener);
        return () => subscription.dispose();
      },
      () => manager.snapshot(),
      () => manager.snapshot(),
    ),
  };
}

export function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `channel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function operationFence(snapshot: ChannelManagerSnapshotV3, expectedRevision = snapshot.revision) {
  return {
    contract: "cordisx.channel-manager-request/v2",
    schemaVersion: 2,
    requestId: requestId(),
    expectedRevision,
    profileId: snapshot.profileId,
    hostGeneration: snapshot.hostGeneration,
  } as const;
}

export function targetFence(snapshot: ChannelManagerSnapshotV3, expectedRevision = snapshot.revision) {
  return {
    contract: "cordisx.channel-manager-target-request/v1",
    schemaVersion: 1,
    requestId: requestId(),
    expectedRevision,
    profileId: snapshot.profileId,
    hostGeneration: snapshot.hostGeneration,
  } as const;
}

export async function createChannelConnection(
  manager: ChannelManagerV2,
  snapshot: ChannelManagerSnapshotV3,
  input: {
    readonly platform: "simulator" | "feishu" | "lark";
    readonly displayName: string;
    readonly selectors: readonly ("direct" | "group")[];
  },
): Promise<"applied" | "conflict" | "rejected" | "unavailable"> {
  let issued;
  if (input.platform === "simulator") {
    issued = await manager.issue({
      ...targetFence(snapshot),
      operation: "target.connection.create.simulator",
      adapterKind: "simulator",
      target: { kind: "root" },
    });
    if (
      issued.status !== "applied" || issued.operation !== "target.connection.create.simulator"
      || issued.target.kind !== "connection-draft"
    ) return issued.status;
  } else {
    const captureTarget = await manager.issue({
      ...targetFence(snapshot),
      operation: "target.credential.capture.create",
      purpose: "create",
      adapterKind: input.platform,
      target: { kind: "root" },
    });
    if (
      captureTarget.status !== "applied" || captureTarget.operation !== "target.credential.capture.create"
      || captureTarget.target.kind !== "credential-capture"
    ) return captureTarget.status;
    const captured = await manager.execute({
      ...operationFence(snapshot, captureTarget.revision),
      operation: "credential.capture",
      target: captureTarget.target,
    });
    if (captured.status !== "applied" || captured.operation !== "credential.capture") return captured.status;
    issued = await manager.issue({
      ...targetFence(snapshot, captured.revision),
      operation: "target.connection.create",
      target: { kind: "credential-draft", credentialDraftToken: captured.credentialDraftToken },
    });
    if (
      issued.status !== "applied" || issued.operation !== "target.connection.create"
      || issued.target.kind !== "connection-draft"
    ) return issued.status;
  }

  const result = await manager.execute({
    ...operationFence(snapshot, issued.revision),
    operation: "connection.create",
    target: issued.target,
    draft: { displayName: input.displayName, selectors: input.selectors },
  });
  return result.status;
}

export function routeToken(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function accountByToken(
  snapshot: ChannelManagerSnapshotV3,
  token: string | undefined,
): ChannelManagerAccountV3 | undefined {
  return snapshot.accounts.find(account => account.connectionToken === token);
}

export function bindingsForAccount(
  snapshot: ChannelManagerSnapshotV3,
  connectionToken: string,
): readonly ChannelManagerBindingV3[] {
  return snapshot.bindings.filter(binding => binding.connectionToken === connectionToken);
}

export function stateLabel(locale: string, state: ChannelManagerAccountV3["connectionState"]): string {
  const labels: Record<ChannelManagerAccountV3["connectionState"], readonly [string, string]> = {
    disabled: ["Disabled", "已停用"],
    starting: ["Starting", "启动中"],
    ready: ["Connected", "已连接"],
    retrying: ["Retrying", "重试中"],
    unavailable: ["Unavailable", "不可用"],
    stopped: ["Stopped", "已停止"],
  };
  return labels[state][locale.startsWith("zh") ? 1 : 0];
}
