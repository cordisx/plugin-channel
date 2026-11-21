import type {
  ChannelManagerFormMountResultV1,
  ChannelManagerFormOptionsV1,
} from "@cordisx/protocol/channel-manager/v7";

/** Retry only bounded, read-only form admission; never retry a save. */
export async function mountConnectionFormWithRetry(
  mount: (options: ChannelManagerFormOptionsV1) => Promise<ChannelManagerFormMountResultV1>,
  options: ChannelManagerFormOptionsV1,
): Promise<ChannelManagerFormMountResultV1 | undefined> {
  for (let index = 0; index < 3 && !options.signal.aborted; index += 1) {
    let result: ChannelManagerFormMountResultV1;
    try {
      result = await mount(options);
    } catch {
      result = { status: "unavailable", code: "HOST_FORM_UNAVAILABLE" };
    }
    if (options.signal.aborted) {
      if (result.status === "mounted") result.dispose();
      return undefined;
    }
    if (
      result.status === "mounted" || index === 2
      || !["HOST_FORM_UNAVAILABLE", "TARGET_UNAVAILABLE"].includes(result.code)
    ) {
      return result;
    }
    await new Promise<void>(resolve => {
      const finish = () => {
        clearTimeout(timer);
        options.signal.removeEventListener("abort", finish);
        resolve();
      };
      const timer = setTimeout(finish, 150);
      options.signal.addEventListener("abort", finish, { once: true });
      if (options.signal.aborted) finish();
    });
  }
  return undefined;
}
