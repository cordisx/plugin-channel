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
`3f0dbcd8b04ae83c920d2d913ac2c313af5f83f1` and the formal Host provider at
`dfb071e02eca0ef52f84d67b2393c25aced7d3f0`.

See [MIGRATION.md](MIGRATION.md) for the boundary and delivery order.

## Ownership

This plugin owns localized Channel routes, page body presentation, its view
model, one page factory and lifecycle, `src/channel.css`, and the Simulator
adapter definition loaded through the public `ctx.channel` service.

CordisX Host continues to own Manager chrome and history, credential capture,
download handling, semantic UI primitives, accessibility policy, native
integration, the single Channel runtime, credential-bearing adapter transport,
and adapter publication authority. The plugin will not
import private Host files or carry credentials, raw account identifiers,
filesystem paths, DOM handles, or transport callbacks.

The package remains private at version `0.1.0` to prevent accidental
publication before the Host-stamped service configuration revision and final
consumer removal are complete.

## Notification feedback

See [operation notifications and candidate SDK setup](./.agents/docs/notifications.md).
