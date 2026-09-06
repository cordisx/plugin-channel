# Repository Guide

- This repository owns the public CordisX Channel management plugin.
- Read the organization [CSS ownership and maintenance rule](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/css.md) before changing CSS or style-bearing DOM.
- Follow the organization [file-size rule](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/file-size.md) and [splitting guide](https://github.com/cordisx/cordisxmono/blob/main/.agents/docs/splitting-files.md).
- Follow [cross-repository changes](https://github.com/cordisx/cordisxmono/blob/main/.agents/rules/cross-repo-changes.md) for Protocol or Host dependencies.
- Use only versioned public Protocol and Host exports. Never copy Host-private renderer, launcher, service-config, credential, DOM, or adapter implementation into this repository.
- Keep Host chrome, routing history, credential capture, downloads, accessibility primitives, and native integration Host-owned.
- Run `npm run check` before delivery.
