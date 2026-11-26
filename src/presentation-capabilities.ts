import type { ChannelManagerV2 } from "@cordisx/protocol/channel-manager/v2";

/** A new facade must be explicitly requested and positively identify its restricted presentation. */
export function configurationOnlyPresentation(manager: unknown): manager is ChannelManagerV2 {
  try {
    if (manager === null || typeof manager !== "object") return false;
    const capabilities: unknown = Reflect.get(manager, "configurationPresentationCapabilities");
    if (typeof capabilities !== "function") return false;
    const value: unknown = capabilities.call(manager);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && Reflect.get(value, "contract") === "cordisx.channel-manager-configuration-presentation-capabilities/v1"
      && Reflect.get(value, "schemaVersion") === 1 && Reflect.get(value, "mode") === "configuration-only"
      && typeof Reflect.get(manager, "snapshot") === "function"
      && typeof Reflect.get(manager, "subscribe") === "function"
      && typeof Reflect.get(manager, "mountConnectionConfigurationForm") === "function";
  } catch {
    return false;
  }
}

/** The restricted facade must explicitly advertise connection control. */
export function configurationConnectionControl(manager: unknown): boolean {
  if (!configurationOnlyPresentation(manager)) return false;
  try {
    const capabilities: unknown = Reflect.get(manager, "configurationPresentationCapabilities");
    const value: unknown = (capabilities as () => unknown).call(manager);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && Reflect.get(value, "connectionControl") === "enable-disable"
      && typeof Reflect.get(manager, "execute") === "function";
  } catch {
    return false;
  }
}

/** Reconnect is independent and never follows from enable/disable alone. */
export function configurationConnectionReconnect(manager: unknown): boolean {
  if (!configurationConnectionControl(manager)) return false;
  try {
    const capabilities: unknown = Reflect.get(manager as object, "configurationPresentationCapabilities");
    const value: unknown = (capabilities as () => unknown).call(manager);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && Reflect.get(value, "connectionReconnect") === true;
  } catch {
    return false;
  }
}

/** A restricted facade must explicitly support the Host-owned credential flow. */
export function configurationConnectionCreate(manager: unknown): boolean {
  if (!configurationOnlyPresentation(manager)) return false;
  try {
    const capabilities: unknown = Reflect.get(manager, "configurationPresentationCapabilities");
    const value: unknown = (capabilities as () => unknown).call(manager);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && Reflect.get(value, "connectionCreate") === "credentialed"
      && typeof Reflect.get(manager, "issue") === "function"
      && typeof Reflect.get(manager, "execute") === "function";
  } catch {
    return false;
  }
}

/** Pending identities are editable only when the owner advertises the Host form path. */
export function configurationPendingTenantResolution(manager: unknown): boolean {
  if (!configurationOnlyPresentation(manager)) return false;
  try {
    const capabilities: unknown = Reflect.get(manager, "configurationPresentationCapabilities");
    const value: unknown = (capabilities as () => unknown).call(manager);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && Reflect.get(value, "pendingTenantResolution") === true;
  } catch {
    return false;
  }
}

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
