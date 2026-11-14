import { useEffect } from "cordisx/react";
import { EmptyState } from "cordisx/ui";
import { copy } from "../locales.js";
import { registerChannelCollection } from "../manager-collection.js";
import type { ChannelPageProps } from "../page-types.js";

export function ChannelList({ managerCollection, manager, locale }: ChannelPageProps) {
  useEffect(() => {
    if (managerCollection === undefined) return;
    return registerChannelCollection(managerCollection, manager, locale);
  }, [managerCollection, manager, locale]);
  return managerCollection === undefined ? <EmptyState title={copy(locale, "collection.unavailable")} /> : null;
}
