# Channel Manager UI

Channel Manager v8 mounts one Host-owned connection form with application
identity, optional replacement secret, display name and group reception. A
blank secret preserves the existing key; one save commits the whole change and
one reset undoes the draft. v7 and older workflows remain capability-detected.
Configuration enable/disable and reconnect are structured standard-header
actions bound to the live page's Host route params. Snapshot changes update
availability and label without replacing the page or its draft.

When the Host exposes Channel Manager v7, “Messages and commands” navigates
under Channels to a standard secondary page and mounts the Host policy form.
The configuration tab mounts the Host application-credential fields inline;
existing secrets are never read or returned to the plugin. Older Hosts retain
their frozen modal workflows. Page disposal retires each mount.

On navigation v6 Hosts, the connection identity, state/configuration badges and
four localized queue counts appear once in the Host summary before sibling
tabs. Runtime status keeps diagnostics. Channel supplies display-only public
snapshot data; it never inserts chrome with plugin CSS. Log rows use shared
Card, Stack, Icon and status primitives while retaining query/pagination fences.

When the Host exposes Channel Manager v6, “Messages and commands” uses its
owned reply-policy form to configure main-stream, quoted or topic replies,
Agent choice, fallback and scoped defaults. Older Hosts retain their v4/v5
policy form; they cannot expose the successor reply fields. The plugin never
renders another policy form or chooses a fixed transport reply mode.

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

Channel uses the explicit public `channel-manager/v5` `forOwnService()` facade
for its own connections and bindings. It does not request user account/read or
binding/write grants for these internal management calls. A Host without the
entrypoint or an active matching service shows unavailable. Other plugins use
the delegated Channel API and its permissions. See
[owned-service semantics](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/channel-runtime/manager-v5-service-owner.md).

Registration replacement, page disposal, and plugin deactivation retire the
collection handle and its Channel subscription. A failed registration also
disposes its source. An older Host without `managerCollection` gets an honest
unavailable state rather than a private renderer fallback.

## Snapshot-only presentation candidate

The proposed Channel Manager v15 own-service presentation descriptor can
identify a snapshot-only Host. In that mode Channel registers only the
connection list and runtime-status routes, directs connection rows to status,
and omits settings, creation, configuration, logs, conversation and binding
controls. The existing snapshot and local subscription still drive the list;
they do not authorize operations. A Host that advertises an invalid or failed
descriptor is treated as snapshot-only. Hosts without the additive entrypoint
retain their existing behavior, including their own feature checks.

The proposed v16 configuration facade is requested separately and must return
its exact `configuration-only` descriptor and the v8 Host form before Channel
shows configuration. In this mode only the list, configuration and runtime
routes are registered; creation, policy, logs and sessions remain hidden.
Connection controls require explicit capabilities. A pending identity without
a usable form opens runtime status.
Invalid descriptors fail closed, and an older v15 facade remains read-only.
If the facade explicitly advertises `connectionControl: "enable-disable"`,
Channel reuses the standard connection header toggle for resolved accounts.
An additional explicit `connectionReconnect: true` capability exposes the
existing reconnect action for enabled connections. Missing or unknown
capabilities leave the corresponding controls unavailable.

The v15 and v16 specifications and Host implementation are separate pending changes;
this compatibility path does not imply that either is merged, published, or
available in an installed Host. The plugin continues building against its
current locked Protocol version while feature-detecting the proposed entrypoint.

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

## Workflow compatibility

Manager v11 consolidates the settings entry in the Channels homepage's standard
header. Four Host-rendered sibling tabs cover new-chat defaults, messages and
replies, permission groups and rules, and sidebar grouping. Finite choices use
the shared RadioGroup presenter, with distinct semantic field and action icons.
Host keeps drafts across these tabs. Saving or undoing a section preserves
the other sections' drafts, and saves merge with the latest complete policy
under its revision fence. A concurrent change to the same section requires a
refresh before saving.

Before v13 adoption, the live own-service settings destination suppressed the
duplicate Host new-chat-default shortcut while its route and page were
available, restoring the fallback on retirement or denied rendering. Those
Hosts edit the existing CordisX profile defaults; policy uses the separate
Channel policy store. The v13 Host implementation below keeps the general
entry independent. Older Hosts retain their original form workflow.
See [the v11 contract](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/channel-runtime/manager-v11-settings.md).

On Manager v13 Hosts, the new-chat tab uses the public
`mountChannelCreationDefaultsForm` instead. General profile defaults are the
base; the independent Channel layer overrides only explicit fields, while
missing/`inherit` fields and later general-default changes flow through to
new Channel tasks. Explicit false remains an override. Existing tasks and
ordinary chats are unaffected by changes to the Channel layer. Narrower
task-model rules keep precedence. Frozen v11-v12 Hosts keep their original
general-default form; the plugin detects the method and never writes a private
Host store. The general Host default entry is independent of the Channel tab.
See [the v13 contract](https://github.com/cordisx/cordisx-protocol/blob/main/.agents/docs/channel-runtime/manager-v13-creation-defaults.md).

Manager v10 adds an explicit paged remote-conversation directory and child
detail routes beneath the selected connection. Channel renders the public
conversation cards with shared Host identity/search controls. Host owns the
breadcrumb, summary and Messages / Local chats tabs. Only retained local
transport facts appear in Messages; local Codex transcript text is never read.
The Local chats tab keeps all binding operations and opens a binding through
Host navigation without resuming a turn. Page limits bound a read, not the
number of persistent bindings. Older Hosts retain the legacy binding body.

Conversation pages first reuse the current public display catalog. The Host
persists account-scoped names and normalized avatars across launcher restarts;
the plugin keeps issued tokens in memory only. Visible list/detail pages
revalidate through the existing public Manager reads after background lookup,
periodically, and on focus. Unchanged list display preserves the existing
items, and a failed refresh leaves the last display in place. Page disposal
retires refresh timers and requests. Messages, permissions and binding
operations continue to use their authoritative readback, not the display cache.

The public collection snapshot contract bounds a single response to 1,000
items; the paged conversation body uses shared Card and FilterToolbar controls
without converting that snapshot bound into a relationship limit. Search
applies to loaded pages and the displayed count makes that scope explicit.

The package builds against the Host beta.67 UI SDK and the exact merged Protocol
source `be1e7fcb49c730c5806db6ca1925958804288674`. That source contains the
v14 continuation form contract; the earlier npm Protocol beta.15 does not acquire
it from the package version alone. The existing settings navigation adds a
Continuation tab and mounts the Host form when available; older Hosts show the
unavailable state. Session execution forms, progressive target
commands, custom native
approval cards and independent package documentation require the Host
implementation of Manager v9 and the linked workflow contracts; an older
Host does not acquire those features by installing this plugin. New methods
remain capability-detected and preserve their documented unavailable paths.

The manifest imports Protocol v16 directly rather than requiring an unpublished
Host SDK export. See the [workflow contract](https://github.com/cordisx/cordisx-protocol/blob/dc39c84ed32a0af13ad14655491b605a4a7be45a/.agents/docs/channel-runtime/workflow-v3.md).
