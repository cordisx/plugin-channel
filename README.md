# CordisX Channel

This public repository is the owner of the CordisX Channel management plugin.
It preserves the filtered Git authorship history of the former built-in Host
directory through Host commit
`1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11`.
The repository is licensed under AGPL-3.0-or-later, matching that source
history.

## Current checkpoint

The repository now builds an executable plugin candidate.
The former built-in source depended on private Host renderer, service-config,
credential, and Channel Manager modules. Those files remain in Git history for
provenance and have been removed from the public source tree.

The candidate consumes the formal Protocol Channel Manager v2 types at
`9654023d1b1077d6fd0d43a2d294459bab63216b`. Activation still waits for one
formal Host dependency:

- A source-bound Host renderer facade for snapshots, subscriptions, exact
  fenced operations, safe log pages, and Host-owned export handoff.

See [MIGRATION.md](MIGRATION.md) for the boundary and delivery order.

## Ownership

This plugin will own localized Channel routes, page body presentation, its view
model, one page factory and lifecycle, and `src/channel.css`.

CordisX Host continues to own Manager chrome and history, credential capture,
download handling, semantic UI primitives, accessibility policy, native
integration, and the Channel runtime/provider adapter. The plugin will not
import private Host files or carry credentials, raw account identifiers,
filesystem paths, DOM handles, or transport callbacks.

The initial package is private at version `0.0.0` to prevent accidental
publication before the public seam and executable package graph are complete.
