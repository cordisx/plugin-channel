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

Public references:

- [Host Manager navigation](https://github.com/cordisx/cordisx/blob/main/.agents/docs/manager-settings-navigation.md)
- [Protocol navigation groups v2](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/manager-settings-navigation/groups-v2.md)
- [Protocol Manager collection v1](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/manager-collection/README.md)
