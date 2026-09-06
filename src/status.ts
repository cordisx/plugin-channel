/** Executable owner candidate; live activation awaits the formal Host provider. */
export const CHANNEL_PLUGIN_STATUS = "host-provider-pending" as const;

export const REQUIRED_BASELINES = Object.freeze({
  host: "1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11",
  protocol: "9654023d1b1077d6fd0d43a2d294459bab63216b",
});
