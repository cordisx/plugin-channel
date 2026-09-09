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
See the [Host notification guide](https://github.com/cordisx/cordisx/blob/3158c0401a3f604727f623f1a8ac584017dd8540/.agents/docs/notifications.md)
for the interaction contract and older-Host capability boundary.

The notification migration currently uses exact feature-branch SDK/Protocol
revisions; it is not evidence of a formal release or a Mono pointer upgrade.

Candidate setup: [notification migration](./.agents/docs/notifications.md).
