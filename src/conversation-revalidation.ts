import { useEffect, useRef } from "cordisx/react";

/** Read through the public Manager while this page is visible; never owns a second transport. */
export function useConversationRevalidation(
  read: (signal: AbortSignal) => Promise<void>,
  scope: string | undefined,
  pageSignal: AbortSignal,
  owner: object,
): void {
  const latest = useRef(read);
  latest.current = read;
  useEffect(() => {
    if (!scope || pageSignal.aborted) return;
    const lifetime = new AbortController();
    const signal = AbortSignal.any([lifetime.signal, pageSignal]);
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let pending = false;
    const refresh = () => {
      if (pending || signal.aborted || document.visibilityState === "hidden") return;
      pending = true;
      void latest.current(signal).catch(() => undefined).finally(() => {
        pending = false;
      });
    };
    const later = (delay: number, action = refresh) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!signal.aborted) action();
      }, delay);
      timers.add(timer);
    };
    const focused = () => {
      refresh();
      later(3_000);
    };
    const periodic = () => {
      refresh();
      later(3_000);
      later(30_000, periodic);
    };
    // Pick up the completion of the first background name/avatar lookup.
    later(3_000);
    later(6_000);
    later(30_000, periodic);
    window.addEventListener("focus", focused);
    document.addEventListener("visibilitychange", focused);
    const cleanup = () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      window.removeEventListener("focus", focused);
      document.removeEventListener("visibilitychange", focused);
    };
    signal.addEventListener("abort", cleanup, { once: true });
    return () => {
      lifetime.abort();
      cleanup();
      signal.removeEventListener("abort", cleanup);
    };
  }, [scope, pageSignal, owner]);
}
