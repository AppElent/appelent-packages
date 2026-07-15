---
name: cli
description: Use when adding a command-line interface to an Appelent app. CLI is a shipped, active capability owned by the @appelent/cli package — this skill points at the real integration docs; it does not stamp code itself.
---

# cli

CLI is an **active, package-owned** capability: `@appelent/cli`. It is no longer
a candidate — do not write a design/plan from scratch or invent a local pattern.

The source of truth for how to consume it is the package README (tool-agnostic,
also what Codex reads), not this skill:

- **Package + README**: `../../packages/cli` relative to this file (i.e.
  `packages/cli` at the root of this catalog repo checkout) — `createCli({
  appName })` factory, the `cli/index.ts` bin-wrapper pattern, config/env
  conventions, and the `CliCommand` extension seam for app-specific domain
  commands.
- **Reference implementation**: `workouts` — `cli/index.ts` wraps
  `createCli({ appName: "workouts" })`; `@appelent/cli` is a normal dependency.
- **New-app bootstrap**: the `baseline` feature (shared `@appelent` packages step).

## To add CLI to an app

1. `pnpm add @appelent/cli` (scope needs the `.npmrc` registry mapping — see
   the `baseline` feature (shared `@appelent` packages step)).
2. Add a thin `cli/index.ts` wrapper calling `createCli({ appName: "<app>" })`
   and a `"<app>": "tsx cli/index.ts"` script — copy the workouts shape. Add
   a wrapper smoke script such as `"cli:smoke": "tsx cli/index.ts --help &&
   tsx cli/index.ts config get --json && tsx cli/index.ts auth status"` and a
   small CI workflow that installs with GitHub Packages auth and runs it.
3. App-specific commands (that hit the app's own API/Convex functions) go in the
   app via the `commands: CliCommand[]` option — **not** in the shared package.
   Keep `@appelent/cli` generic; never fork it into the app.
4. Record in `appelent.json` at the app root (same commit as the wiring):
   `"cli": { "version": 1 }`.

## Publishing model

Most apps do **not** need to publish themselves to use a CLI. The default
Appelent pattern is repo-local: `pnpm <app>` runs the app's TypeScript wrapper
through `tsx`.

Publish only the shared `@appelent/cli` package when generic CLI behavior
changes (for example browser login, config storage, output helpers, or shared
auth helpers), then bump consuming apps to the newly published version. Do not
publish an app package just to get `pnpm <app>` working. If an app intentionally
needs an npm-installable app-specific binary later, design that separately: it
needs a scoped package name, a real compiled JS `bin`, and a focused publish
workflow.

## Self-improvement

When this skill's work is done, follow the reflection in
`../appelent-feature/references/self-improvement.md` — notice what was unclear
or underspecified about *this skill* and offer to file it back to the catalog.
Nothing noteworthy is the normal outcome — say nothing then.

If you got here via `/appelent:feature apply cli`, that run's own reflection
(`apply` step 6) already covers this skill — don't reflect twice.
