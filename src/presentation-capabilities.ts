import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";

/** Older Hosts keep their existing behavior; an invalid advertised descriptor fails closed. */
export function snapshotOnlyPresentation(manager: ChannelManagerV2, mustNegotiate = false): boolean {
  try {
    const candidate: unknown = Reflect.get(manager, "presentationCapabilities");
    if (typeof candidate !== "function") return mustNegotiate;
    const value: unknown = candidate.call(manager);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return true;
    const contract: unknown = Reflect.get(value, "contract");
    const schemaVersion: unknown = Reflect.get(value, "schemaVersion");
    const mode: unknown = Reflect.get(value, "mode");
    if (
      contract !== "cordisx.channel-manager-presentation-capabilities/v1" || schemaVersion !== 1
      || (mode !== "standard" && mode !== "snapshot-only")
    ) return true;
    return mode === "snapshot-only";
  } catch {
    return true;
  }
}
