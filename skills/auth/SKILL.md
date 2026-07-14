---
name: auth
description: Use when adding the Appelent auth feature (Clerk + @appelent/auth HeaderUser, theme tokens, THEME_INIT_SCRIPT) to an app, or updating an app's auth wiring to the current package version.
---

# auth

Read `FEATURE.md` in this folder first. Auth is package-owned: the
integration source of truth is `packages/auth/README.md` in
https://github.com/AppElent/appelent-packages — reachable locally as
`../../packages/auth` relative to this file, i.e. `packages/auth` at the
root of this catalog repo checkout. Do not re-derive patterns from scratch
and do not fork package code into the app.

## Apply

1. `pnpm add @appelent/auth` (requires the baseline `.npmrc` scope mapping).
2. Follow the package README: mount `HeaderUser` config-driven in the app
   header, import `tokens.css`, inline `THEME_INIT_SCRIPT` in `__root.tsx`.
3. Verify Clerk → Convex JWT template `convex` exists (baseline owns this).
4. Record in `appelent.json` at the app root (same commit as the wiring):
   `"auth": { "version": 1 }`.

## Update

Compare the app's recorded version against this folder's `FEATURE.md`
version; apply the Changelog deltas. For package-only changes, a normal
`pnpm up @appelent/auth` suffices.
