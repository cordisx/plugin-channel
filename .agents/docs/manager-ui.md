# Channel Manager UI

Channel contributes its Manager destination through exact surface-v11 metadata
and `navigationGroup: { id: "external-accounts" }`. Host owns the shared
External connections / 外部连接 category; other plugins can register there
through the same public contract. The machine id stays compatible with
navigation groups v2 and does not grant Channel permissions.

The list page registers one page-scoped `managerCollection` source. Host owns
the grouped list, search, views, focus, empty/loading states, and row navigation.
Channel supplies public connection names, platform/state summaries, same-owner
detail routes, and complete selected-view snapshots. It echoes the exact Host
query revision and normalized search instead of performing approximate search.
No credentials, private account references, or raw connection errors become
searchable list metadata.

The standard Host page header declares the create action. Its disabled state
follows the current public Channel Manager's advertised creation operations;
the command checks availability again before navigating. Connection detail
pages keep the standard Host breadcrumb and sibling tabs. Plugin-owned form,
runtime, log, and binding bodies use `cordisx/ui` controls and their own CSS.

Registration replacement, page disposal, and plugin deactivation retire the
collection handle and its Channel subscription. A failed registration also
disposes its source. An older Host without `managerCollection` gets an honest
unavailable state rather than a private renderer fallback.

On a Host advertising `managerCollection.registerV2`, the source supplies the
generic identity visual: the bundled platform icon, or authenticated account
artwork with the platform icon in its lower-right corner. It reads account
artwork and the bot name only from public `channelManager.snapshotWithIdentity`.
The optional user connection label takes precedence over the bot name. A mounted
list performs a bounded read-only identity refresh and releases its timer and
request on disposal; it never logs in, reconnects, or reads an avatar URL.
Older Hosts continue to get the frozen v1 semantic icon source.

The shared Host owns all image geometry, clipping, contrast and image failure
fallback. Feishu and Lark use the existing bundled platform artwork. Unsupported
platform artwork retains an honest semantic icon; no account avatar is invented.

Public references:

- [Host Manager navigation](https://github.com/cordisx/cordisx/blob/main/.agents/docs/manager-settings-navigation.md)
- [Protocol navigation groups v2](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/manager-settings-navigation/groups-v2.md)
- [Protocol Manager collection v1](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/manager-collection/README.md)
- [Protocol identity visuals v2](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/manager-collection/v2.md)
