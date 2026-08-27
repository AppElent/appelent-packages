# appelent-packages

The Appelent feature catalog for Claude Code and Codex.

## Feature catalog

Each folder under `skills/` is one **feature** (a shared design decision):
`FEATURE.md` describes it (stack, architecture, configuration, versioned
changelog), `SKILL.md` applies it to an app. Packaged features have their
runtime code under `packages/` (published to GitHub Packages as `@appelent/*`).

| Feature | Stage | Package |
| --- | --- | --- |
| baseline | guided | — |
| auth | packaged | `@appelent/auth` |
| cli | packaged | `@appelent/cli` |
| i18n | packaged | `@appelent/i18n` |
| mcp | documented | — |

A feature is a **ready-made module you add to an app**: it installs code or
writes files, and records its version in that app's `appelent.json`. Skills
that leave nothing behind — review passes, dependency upgrades, coding
guidelines the agent merely reads — are not features. They live in the
**toolbox** plugin ([`AppElent/appelent-skills`](https://github.com/AppElent/appelent-skills),
`/toolbox:skill`), which is where `review-app`, `review-session` and
`upgrade-deps` moved in 0.3.0. Skills specific to one app live in that app's
own `.claude/skills/`, hand-written — never copied from either repo.

## Install (Claude Code)

```bash
claude plugin marketplace add AppElent/appelent-packages
claude plugin install appelent@appelent
```

The github source clones tracked files only. **Do not** add the repo as a
local Directory source — that copies `node_modules` and fails on Windows.

- **Local dev on this machine:** `claude --plugin-dir "D:\Dev\appelent-packages"`
  loads the plugin in place with no copy; edits apply on restart.
- **Update:** `claude plugin update appelent`.
- **Claude Code web:** `.claude/settings.json` in this repo declares the
  plugin via `enabledPlugins`/`extraKnownMarketplaces`, and the web UI does
  show it as installed — but in testing, that alone doesn't register the
  plugin's commands/skills (undocumented gap, not just a config mistake).
  The confirmed fix: open **claude.ai/code → this repo → Configure cloud
  environment**, and add a **Setup script**:
  ```bash
  #!/bin/bash
  claude plugin marketplace add AppElent/appelent-packages
  claude plugin install appelent@appelent
  ```
  This is a per-user, per-environment setting — it lives in your own cloud
  environment config, not in the repo, so every collaborator using web
  needs to paste it into their own environment settings once. `.claude/settings.json`
  is left in place too (harmless, and may start working outright once
  Anthropic closes this gap). `apply baseline`, `capture`, and `status --all`
  still need a writable local checkout of this catalog repo (web sessions
  only check out the current repo); set `$APPELENT_CATALOG_PATH` if it
  isn't at the default `D:\Dev\appelent-packages`, or skip those steps on
  web.

## Install (Codex)

Codex uses a local marketplace entry. Mirror the GitHub repo into
`~/plugins/appelent` and install from the personal marketplace:

```bash
node scripts/setup-codex.mjs
codex plugin add appelent@personal
```

Start a new Codex task after installing so plugin skills are loaded.

- **Local dev on this machine:** `node scripts/setup-codex.mjs --dev` links
  `~/plugins/appelent` at this checkout. Pair it with
  `claude --plugin-dir "D:\Dev\appelent-packages"` so both agents read the
  same working tree.
- **Update:** re-run `node scripts/setup-codex.mjs`.

The script is Node, not PowerShell, so it works on Windows, macOS and Linux.

GitHub is the source of truth for both agents. **Any** change to `skills/` or
`commands/` must bump `.claude-plugin/plugin.json` and
`.codex-plugin/plugin.json` to the same version in the same commit — both
agents serve skills from a version-pinned local cache, so without a bump they
keep running the old prose and never pick the change up.

`pnpm validate:catalog` enforces this: it fails when files under `skills/` or
`commands/` changed against the merge-base with `main` but the version didn't.
It's advisory by design — it skips silently when it can't resolve a base (no
git, shallow CI clone, detached HEAD), so bump deliberately rather than relying
on it. Before this check existed the rule was documented but unenforced, and
0.1.5 shipped four skill changes late as a result.

## Usage

- Feature catalog: `/appelent:feature list | show <feature> | apply <feature> [options] | capture <topic> | issue <text> | issues | fix <n> [n...]`.
- Project: `/appelent:project list | status [--all] | issue <text> | issues | fix <n> [n...]`.
- Review passes and dependency upgrades: `/toolbox:skill` (the
  [`appelent-skills`](https://github.com/AppElent/appelent-skills) repo).
- Onboard a project (new or existing): `/appelent:feature apply baseline`, then
  add features à la carte.
- Apps record their opted-in features and options in their own `appelent.json`.
- Contract check for the catalog: `pnpm validate:catalog`.
