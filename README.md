# CordisX Channel

Channel provides a CordisX workspace for viewing and managing channel accounts,
runtime state, logs, and Session bindings. This release includes the local
Simulator adapter and uses Host-owned flows for real provider credentials and
transport.

## Install

Plugin ID: `channel`. Current release: `0.1.1`.

The CordisX Community Marketplace feed must already be configured and enabled
before `--source` can select it:

```sh
FEED_URL=https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json
npx cordisx@beta source add "$FEED_URL" --yes
npx cordisx@beta plugin install channel --source "$FEED_URL" --version 0.1.1
```

Skip `source add` when that exact feed is already enabled. For another profile,
add the same `--profile <profile>` argument to both commands. `--yes` confirms
the source change only; it does not approve plugin permissions. A discovery
source is not a trust root.

The install command becomes available after the Marketplace entry lists the
`0.1.1` artifact. Until then, download the archive and `SHA256SUMS` from the
[GitHub release](https://github.com/cordisx/plugin-channel/releases/tag/v0.1.1).

## Use

Open Channel Manager in CordisX to list available accounts. From an account you
can inspect configuration, runtime counters, logs, and Session bindings, then
run only the operations exposed by the Host for that account.

The bundled Simulator connection uses the fixed local target
`simulator/local/test`. Creating Feishu or Lark connections continues through
Host-owned credential capture; the plugin does not store provider credentials
or implement their transport.

## Configuration

The Channel service reads a Host-provided `cordisx.channel-service-config/v1`
configuration on plugin restart. Configure connections through CordisX. The
plugin registers only enabled Simulator definitions that match its declared
scope and fails closed on malformed or stale configuration.

## Permissions and limits

Account read access is required. Connect, receive, subscribe, send, binding
read/write, and attachment read capabilities are optional and separately
scoped. The packaged Simulator scope is limited to its local test tenant and
direct test conversation. Review requested permissions before enabling them.

The Host remains responsible for credentials, native integration, downloads,
accessibility, navigation history, and the channel runtime. Unsupported or
unavailable operations stay disabled rather than falling back to private APIs.

## Troubleshooting

- **Install cannot find version `0.1.1`:** confirm the Marketplace entry lists
  the release artifact. `--source` does not add or repair a feed.
- **No accounts appear:** confirm account-read permission and an enabled Host
  Channel service configuration.
- **A control is disabled:** the Host did not expose that operation for the
  selected account or its permission is not enabled.
- **Simulator is unavailable:** verify the configured adapter, account, and
  tenant are exactly `simulator`, `local`, and `test`.

## License

Channel is licensed under
[AGPL-3.0-or-later](LICENSE). Third-party notices are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Maintainer setup, checks, and
release instructions are in [AGENTS.md](AGENTS.md).
