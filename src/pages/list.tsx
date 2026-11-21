import { useEffect } from "cordisx/react";
import { EmptyState } from "cordisx/ui";
import { copy } from "../locales.js";
import { registerChannelCollection } from "../manager-collection.js";
import type { ChannelPageProps } from "../page-types.js";

export function ChannelList({ managerCollection, manager, locale, snapshotOnly, configurationOnly }: ChannelPageProps) {
  useEffect(() => {
    if (managerCollection === undefined) return;
    return registerChannelCollection(managerCollection, manager, locale, snapshotOnly, configurationOnly);
  }, [managerCollection, manager, locale, snapshotOnly, configurationOnly]);
  return managerCollection === undefined ? <EmptyState title={copy(locale, "collection.unavailable")} /> : null;
}
