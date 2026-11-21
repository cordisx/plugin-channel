import type { ChannelPageProps } from "./page-types.js";
import { copy } from "./locales.js";

export function notifyResult(props: ChannelPageProps, kind: string, success: boolean, code?: string): void {
  props.notifications.show({
    kind: `${kind}.${success ? "saved" : "failed"}`,
    type: success ? "success" : "error",
    message: copy(
      props.locale,
      success ? "operation.saved" : code === "CONFIGURATION_UNAVAILABLE"
        ? "operation.configuration-unavailable"
        : "operation.failed",
    ),
  });
}
