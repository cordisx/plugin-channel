# Channel owner extraction

This repository preserves the filtered authorship history of
`packages/cli/src/plugins/channel` from `cordisx/cordisx` through Host commit
`1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11`.

The initial public checkpoint is intentionally nonfunctional. The former
built-in source depended on Host-private renderer and launcher modules. Those
files are retained in Git history and are not published as standalone source.

Executable migration depended on two public seams:

1. `cordisx/cordisx-protocol` now exports the Channel Manager v2 contract
   family at formal commit
   `9654023d1b1077d6fd0d43a2d294459bab63216b`.
2. `cordisx/cordisx` now provides the source-bound renderer service at formal
   commit `4a33f62bb087ce410ebb1e3f2341f08c3968fce5`.

The plugin candidate now owns its localized routes, page bodies, model,
lifecycle, `src/channel.css`, and Simulator adapter definition. The Host
continues to own Manager chrome, routing history, credential capture, downloads,
semantic controls, native integration, the single Channel runtime,
credential-bearing adapter transport, and adapter publication authority.

No generic service-config bridge, raw account identifier, credential value or
reference, filesystem path, DOM handle, transport callback, or private Host
module may cross the public seam.
