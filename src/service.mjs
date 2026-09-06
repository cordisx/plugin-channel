export const name = "channel-runtime";
export const inject = ["channel"];

const SIMULATOR_REF = Object.freeze({ adapterId: "simulator", accountId: "local", tenantId: "test" });

function validateConfig(value) {
  if (
    value === null || typeof value !== "object" || Array.isArray(value)
    || value.contract !== "cordisx.channel-service-config/v1" || value.schemaVersion !== 1
    || !Array.isArray(value.connections)
  ) {
    throw new TypeError("Channel service configuration is invalid");
  }
  return value;
}

function simulatorDefinition(connection, configurationRevision) {
  const sent = new Map();
  return {
    descriptor: {
      ref: connection.ref,
      kind: "simulator",
      implementationStatus: "verified",
      configurationRevision,
      secretState: "unavailable",
    },
    start: async () => ({
      send: async delivery => {
        const prior = sent.get(delivery.deliveryId);
        if (prior !== undefined) return prior;
        const result = { externalMessageId: `simulated-${delivery.deliveryId}` };
        sent.set(delivery.deliveryId, result);
        return result;
      },
      stop: async () => {},
    }),
  };
}

/**
 * The immutable service artifact owns the simulator only. Official Feishu/Lark
 * definitions remain Host-owned because the plugin never receives credentials
 * or a secret resolver.
 */
export async function apply(ctx, input) {
  const config = validateConfig(input);
  const configurationRevision = ctx.channel.configuration.revision;
  if (!Number.isInteger(configurationRevision) || configurationRevision < 1) {
    throw new TypeError("Channel service configuration revision is invalid");
  }
  for (const connection of config.connections) {
    if (!connection.enabled) continue;
    if (
      connection.adapterKind === "simulator" && connection.transport?.mode === "simulator"
      && connection.ref?.adapterId === SIMULATOR_REF.adapterId
      && connection.ref?.accountId === SIMULATOR_REF.accountId
      && connection.ref?.tenantId === SIMULATOR_REF.tenantId
    ) {
      await ctx.channel.adapters.register(simulatorDefinition(connection, configurationRevision));
    }
  }
}
