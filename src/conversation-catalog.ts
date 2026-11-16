import type { ChannelManagerConversationV1 } from "@cordisx/protocol/channel-manager/v10";

/** Page-read public display projection only; no messages, private refs or second transport store. */
export class ChannelConversationCatalog {
  private readonly conversations = new Map<string, ChannelManagerConversationV1>();
  private readonly listeners = new Set<() => void>();
  adopt(items: readonly ChannelManagerConversationV1[]): void {
    let changed = false;
    for (const item of items) {
      if (JSON.stringify(this.conversations.get(item.conversationToken)) === JSON.stringify(item)) continue;
      this.conversations.set(item.conversationToken, item);
      changed = true;
    }
    if (changed) { for (const listener of this.listeners) listener(); }
  }
  all(): readonly ChannelManagerConversationV1[] {
    return [...this.conversations.values()];
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  dispose(): void {
    this.conversations.clear();
    this.listeners.clear();
  }
}
