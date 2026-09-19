# Repository Guide

- This repository owns the public CordisX Channel management plugin.
- Read the organization [CSS ownership and maintenance rule](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/css.md) before changing CSS or style-bearing DOM.
- Follow the organization [file-size rule](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/file-size.md) and [splitting guide](https://github.com/cordisx/cordisxmono/blob/main/.agents/docs/splitting-files.md).
- Follow [cross-repository changes](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/cross-repo-changes.md) for Protocol or Host dependencies.
- Use only versioned public Protocol and Host exports. Never copy Host-private renderer, launcher, service-config, credential, DOM, or adapter implementation into this repository.
- Keep Host chrome, routing history, credential capture, downloads, accessibility primitives, and native integration Host-owned.
- Run `npm run check` before delivery.

## Operation notifications

Use the public `ctx.notifications.show()` service for operation feedback and
require `notifications` in plugin injection. Do not create a custom Toast,
manually positioned alert, or page-wide success/error paragraph. Keep field
validation and durable business state beside the relevant object. Use stable
semantic `kind` values, localized safe text, and notification rules owned by Host;
never expose raw exceptions or notify on every polling attempt.
See the [Host notification guide](https://github.com/cordisx/cordisx/blob/3cfe370eb7abf33e16686fbd82659cd441247fbd/.agents/docs/notifications.md)
for the interaction contract and older-Host capability boundary.

Dependency setup: [notification migration](./.agents/docs/notifications.md).

## Development and release

- Requires Node.js 22 or newer. Install dependencies with `npm ci`.
- Run `npm run check`, `npm pack --dry-run`, and `git diff --check` before a
  release checkpoint. The package check verifies descriptor and runtime output.
- Keep public READMEs focused on installation and use. Migration history,
  architecture, source layout, local development, tests, and release operations
  belong here or in indexed maintainer documentation.
- Releases use a GitHub prerelease, not npm. Build the exact merged main commit,
  package with `npm pack`, attach the archive with `SHA256SUMS`, then download
  and verify both assets. The archive must contain `cordisx-package.json`, its
  referenced runtime manifest, and the browser and service bundle entries.
- Marketplace artifact URLs and digests are updated separately by the catalog
  owner after verification. Do not copy older trust records.
