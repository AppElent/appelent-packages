---
name: cli
version: 1
description: Repo-local command-line interface for an Appelent app via @appelent/cli
package: "@appelent/cli"
---

# CLI

## What

A per-app CLI (`pnpm <app> ...`) built on the shared `@appelent/cli`
package: browser login/auth flow, config store, Convex client factory,
output formatting, and command registration plumbing. Apps add only their
domain commands.

## Stack

- Package: `@appelent/cli` (GitHub Packages)
- Runner: `tsx` executing a thin `cli/index.ts` wrapper (repo-local; no app
  publishing needed)

## Architecture

- `cli/index.ts` wraps `createCli({ appName: "<app>" })`.
- App-specific commands go in the app via the `commands: CliCommand[]`
  option — never forked into the shared package.
- Reference implementation: the `workouts` repo.

## Configuration

- Script `"<app>": "tsx cli/index.ts"` plus a `cli:smoke` script
  (`--help`, `config get --json`, `auth status`)
- CI workflow installing with GitHub Packages auth and running the smoke

## Changelog

- 1 — initial capture (migrated from the `add-cli` global skill)
