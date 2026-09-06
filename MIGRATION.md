# Channel owner extraction

This repository preserves the filtered authorship history of
`packages/cli/src/plugins/channel` from `cordisx/cordisx` through Host commit
`1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11`.

The initial public checkpoint is intentionally nonfunctional. The former
built-in source depended on Host-private renderer and launcher modules. Those
files are retained in Git history and are not published as standalone source.

Executable migration depends on two formal public seams:

1. `cordisx/cordisx-protocol` must export TypeScript declarations for the
   existing Channel Manager v2 contract family: runtime snapshot v3, request
   and result v2, safe log page v2, and log export result v2.
2. `cordisx/cordisx` must provide a source-bound renderer service that exposes
   only versioned snapshots, subscriptions, exact fenced operations, safe log
   pages, and Host-owned export handoff.

The plugin will then own its localized routes, page bodies, model, lifecycle,
and `src/channel.css`. The Host continues to own Manager chrome, routing
history, credential capture, downloads, semantic controls, native integration,
and the Channel runtime/provider adapter.

No generic service-config bridge, raw account identifier, credential value or
reference, filesystem path, DOM handle, transport callback, or private Host
module may cross the public seam.
