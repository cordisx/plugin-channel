import type { ChannelPageProps } from "./page-types.js";
import { copy } from "./locales.js";

export function notifyResult(props: ChannelPageProps, kind: string, success: boolean): void {
  props.notifications.show({
    kind,
    type: success ? "success" : "error",
    message: copy(props.locale, success ? "operation.saved" : "operation.failed"),
  });
}
