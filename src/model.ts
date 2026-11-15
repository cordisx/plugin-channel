import type {
  ChannelManagerAccountV3,
  ChannelManagerBindingV3,
  ChannelManagerSelectorV2,
  ChannelManagerSnapshotV3,
  ChannelManagerV2,
} from "@cordisx/protocol/channel-manager/v2";
import { useMemo, useSyncExternalStore } from "cordisx/react";
import { copy } from "./locales.js";

export interface ChannelPageModel {
  readonly manager: ChannelManagerV2;
  readonly snapshot: ChannelManagerSnapshotV3;
}

export interface ChannelStore {
  snapshot(): ChannelManagerSnapshotV3;
  subscribe(listener: () => void): () => void;
}

export function createChannelStore(manager: ChannelManagerV2): ChannelStore {
  let current = manager.snapshot();
  let sourceSubscription: ReturnType<ChannelManagerV2["subscribe"]> | undefined;
  const listeners = new Set<() => void>();
  const refresh = () => {
    current = manager.snapshot();
    for (const listener of listeners) listener();
  };
  return {
    snapshot: () => current,
    subscribe: listener => {
      listeners.add(listener);
      if (sourceSubscription === undefined) {
        sourceSubscription = manager.subscribe(refresh);
        current = manager.snapshot();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          sourceSubscription?.dispose();
          sourceSubscription = undefined;
        }
      };
    },
  };
}

export function useChannelModel(manager: ChannelManagerV2): ChannelPageModel {
  const store = useMemo(() => createChannelStore(manager), [manager]);
  return {
    manager,
    snapshot: useSyncExternalStore(
      store.subscribe,
      store.snapshot,
      store.snapshot,
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
    readonly selectors: readonly ChannelManagerSelectorV2[];
  },
): Promise<"applied" | "cancelled" | "conflict" | "rejected" | "unavailable"> {
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
    if (captured.status !== "applied" || captured.operation !== "credential.capture") {
      return captured.code === "CAPTURE_CANCELLED" ? "cancelled" : captured.status;
    }
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

export async function rotateChannelCredential(
  manager: ChannelManagerV2,
  snapshot: ChannelManagerSnapshotV3,
  account: ChannelManagerAccountV3,
): Promise<"applied" | "cancelled" | "conflict" | "rejected" | "unavailable"> {
  const target = { kind: "connection" as const, connectionToken: account.connectionToken };
  const issued = await manager.issue({
    ...targetFence(snapshot),
    operation: "target.credential.capture.rotate",
    purpose: "rotate",
    target,
  });
  if (
    issued.status !== "applied" || !issued.operation.startsWith("target.credential.capture")
    || issued.target.kind !== "credential-capture"
  ) return issued.status;
  const captured = await manager.execute({
    ...operationFence(snapshot, issued.revision),
    operation: "credential.capture",
    target: issued.target,
  });
  if (captured.status !== "applied" || captured.operation !== "credential.capture") {
    return captured.code === "CAPTURE_CANCELLED" ? "cancelled" : captured.status;
  }
  const result = await manager.execute({
    ...operationFence(snapshot, captured.revision),
    operation: "connection.rotate-credential",
    target,
    draft: { credentialDraftToken: captured.credentialDraftToken },
  });
  return result.status;
}

export function routeToken(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function receiveSelectors(groupMode: unknown): readonly ChannelManagerSelectorV2[] {
  if (groupMode === "all") return ["direct", "group"];
  if (groupMode === "mentions") return ["direct", "mentions"];
  return ["direct"];
}

export function canCreateConnection(
  snapshot: Pick<ChannelManagerSnapshotV3, "availableOperations">,
  platform: "simulator" | "feishu" | "lark",
): boolean {
  return snapshot.availableOperations.includes(
    platform === "simulator" ? "target.connection.create.simulator" : "target.credential.capture.create",
  );
}

export function availablePlatforms(
  snapshot: Pick<ChannelManagerSnapshotV3, "availableOperations">,
): readonly ("simulator" | "feishu" | "lark")[] {
  return (["feishu", "lark", "simulator"] as const).filter(platform => canCreateConnection(snapshot, platform));
}

export function canQueryLogs(account: ChannelManagerAccountV3 | undefined): boolean {
  return account?.availableOperations.includes("logs.query") ?? false;
}

export function canExportLogs(account: ChannelManagerAccountV3 | undefined): boolean {
  return account?.availableOperations.includes("logs.export") ?? false;
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
  return copy(locale, `state.${state}`);
}
