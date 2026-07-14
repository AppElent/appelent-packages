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

`review-app`, `review-session`, and `upgrade-deps` also ship as plugin
skills (workflow helpers meant to be copied into an app, see `sync-skills`
below) but aren't catalog features — no `FEATURE.md`, so no table row.

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
- **Claude Code web:** `.claude/settings.json` in this repo declares and
  enables the plugin, so opening this repo (or any repo that carries the
  same `.claude/settings.json`) on [claude.ai/code](https://claude.ai/code)
  loads it automatically — no manual install step. `apply baseline`,
  `capture`, and `status --all` still need a writable local checkout of
  this catalog repo (web sessions only check out the current repo); set
  `$APPELENT_CATALOG_PATH` if it isn't at the default
  `D:\Dev\appelent-packages`, or skip those steps on web.

## Install (Codex)

Codex uses a local marketplace entry. For normal use, mirror the GitHub repo
into `~/plugins/appelent` and install from the personal marketplace:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-codex-plugin.ps1 -Mode Github
codex plugin add appelent@personal
```

Start a new Codex task after installing so plugin skills are loaded.

- **Local dev on this machine:** `powershell -ExecutionPolicy Bypass -File scripts/setup-codex-plugin.ps1 -Mode Dev`
  points `~/plugins/appelent` at this checkout with a junction. Pair it with
  `claude --plugin-dir "D:\Dev\appelent-packages"` so both agents read the
  same working tree.
- **Update:** `powershell -ExecutionPolicy Bypass -File scripts/update-codex-plugin.ps1`.
- **Fallback without plugin packaging:** `powershell -ExecutionPolicy Bypass -File scripts/setup-codex-skills.ps1`
  junctions the skill folders directly into `~/.codex/skills`.

GitHub is the source of truth for both agents. Plugin changes must bump
`.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to the same
version in the same commit; `pnpm validate:catalog` checks that they stay in
sync.

## Usage

- Feature catalog: `/appelent:feature list | show <feature> | apply <feature> [options] | capture <topic>`.
- Project: `/appelent:project list | status [--all] | suggest <idea> | suggestions | review-app | review-session | upgrade-deps | sync-skills <name>...`.
- Onboard a project (new or existing): `/appelent:feature apply baseline`, then
  add features à la carte.
- Apps record their opted-in features and options in their own `appelent.json`.
- Contract check for the catalog: `pnpm validate:catalog`.
