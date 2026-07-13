# Appelent Features Design

Date: 2026-07-13

Supersedes: `2026-07-09-appelent-managed-projects-design.md` (registry, mirrors, and audit sections are replaced; the reuse classification survives inside the feature lifecycle).

## Purpose

Appelent apps share generic design decisions: how auth works, how i18n is wired, how an MCP server is built, how a CLI is added. Today those decisions are spread over five concepts (packages, capability skills, bootstrap skill, global registry JSONs, repo mirrors) stored in three places. There is no single list to read from or add from, and the vocabulary leaks implementation details ("is this a package or a skill?") into everyday conversation.

This design collapses the system into three things:

- **One repo** (`appelent-packages`): the feature catalog, the runtime packages, and the agent skills, distributed as a Claude Code plugin.
- **One file per app** (`appelent.json`): which features the app opted into, with which options, at which version.
- **One front door** (`/appelent`): list, show, apply, capture, status.

## Concept Model

**Feature** is the only user-facing concept. A feature is a generic design decision implemented the same way across projects. It is described by what it is, the tech stack it uses, its architecture, and its configuration — not by how it happens to be delivered.

Every feature lives in one folder and matures through visible lifecycle stages. Maturity is determined by which files exist, not by a status field anywhere else:

| Stage | What exists in the feature folder | Meaning |
| --- | --- | --- |
| **documented** | `FEATURE.md` | The decision is written down: stack, architecture, configuration. Agents follow it when building. |
| **guided** | + real setup steps in `SKILL.md` | Applying the feature to an app is a repeatable, guided procedure. |
| **packaged** | + `packages/<name>` in the workspace | The identical runtime code is versioned and installed as `@appelent/<name>`. |

New topics are added by creating a folder. Example: capturing a future mobile-app standard is `skills/mobile/FEATURE.md` plus a stub `SKILL.md` — no registry to update.

Current features and their stages at migration time:

| Feature | Stage | Package |
| --- | --- | --- |
| baseline | guided (from `custom-bootstrap`) | — |
| auth | packaged | `@appelent/auth` |
| cli | packaged | `@appelent/cli` |
| i18n | packaged | `@appelent/i18n` |
| mcp | documented/guided (from `add-mcp-server`) | — |

## Repo Layout

```text
appelent-packages/
  .claude-plugin/
    plugin.json               # plugin manifest, name "appelent", semver version
    marketplace.json          # repo doubles as its own marketplace
  skills/
    appelent/
      SKILL.md                # front door: list/show/apply/capture/status
    baseline/
      SKILL.md                # apply the project baseline (pnpm, Biome, scripts, CI, wrangler)
      FEATURE.md
    auth/
      SKILL.md                # how to apply auth to an app
      FEATURE.md
    cli/      (same shape)
    i18n/     (same shape)
    mcp/
      SKILL.md                # may be minimal: "read FEATURE.md before building MCP"
      FEATURE.md
  commands/
    appelent.md               # registers /appelent, dispatches to the appelent skill
  packages/
    auth/  cli/  i18n/        # unchanged pnpm workspace; npm publishing as today
  projects.json               # optional, paths-only list of local app repos for status --all
  docs/ ...                   # unchanged
```

Rules:

- One folder per feature under `skills/`. That placement makes each feature an auto-discovered plugin skill; `FEATURE.md` sits in the same folder as a supporting file.
- Packages stay in `packages/` (workspace, build, and publishing are unchanged). The feature folder and the package share a name; the feature's files state which package it installs.
- The repo structure is the catalog. Listing features = listing `skills/` (minus the `appelent` front-door folder).

## FEATURE.md Contract

Frontmatter:

```yaml
---
name: mcp
version: 2            # integer, bumped on meaningful change to the description or skill
description: How Appelent apps expose an MCP server
---
```

Body sections (all required, even if short):

- **What** — one paragraph: what this feature provides.
- **Stack** — the chosen libraries/services, including supported options (e.g. `lib: tanstack-ai-mcp | @modelcontextprotocol/sdk`, `deploy: cloudflare-workers`).
- **Architecture** — where things live in an app, patterns to follow.
- **Configuration** — env vars, wrangler/config entries, scripts.
- **Changelog** — one line per version: what changed and what an already-opted-in app must do about it.

If a user requests an option combination that is not described (e.g. a new MCP library), the apply flow flags it and offers to extend `FEATURE.md` — that is how descriptions grow.

## SKILL.md Contract

Standard Agent Skills format (`name` + `description` frontmatter). The description must be written for auto-triggering, e.g. "Use when adding internationalization to an Appelent app." The body:

- Reads `FEATURE.md` first and honors requested options against the Stack section.
- Performs the app-specific wiring (install `@appelent/<name>` when the feature is packaged, scaffold files, mount routes, add scripts).
- Has an **update path**: given the app's recorded version, apply the changelog deltas rather than fresh-installing.
- Ends by writing/updating the app's `appelent.json` entry in the same commit as the wiring.

## Front Door: /appelent

A `commands/appelent.md` command plus the `skills/appelent` skill. The skill operates on its own sibling folders, so it can never go stale relative to the catalog. Natural language ("what features do I have?", "add i18n here") reaches the same skill via description matching; the command is the guaranteed-explicit path.

- `/appelent list` — table of feature folders: name, one-line description, stage (derived from which files/packages exist), version.
- `/appelent show <feature>` — summarize that feature's `FEATURE.md`.
- `/appelent apply <feature> [options...]` — e.g. `apply mcp using tanstack-ai-mcp on cloudflare`. Loads the feature's `SKILL.md`, wires the app, records the result in `appelent.json`.
- `/appelent apply <feature> --update` — runs the skill's update path from the recorded version to current.
- `/appelent capture <topic>` — interviews the user, writes `skills/<topic>/FEATURE.md` (version 1) and a stub `SKILL.md` in the monorepo checkout.
- `/appelent status [--all]` — see Freshness below.

## Per-App Record: appelent.json

Committed at each app's repo root, written by the apply flow in the same commit as the feature's code, so it cannot drift from reality:

```json
{
  "features": {
    "baseline": { "version": 1 },
    "auth": { "version": 1 },
    "mcp": { "version": 2, "options": { "lib": "tanstack-ai-mcp", "deploy": "cloudflare-workers" } }
  }
}
```

- `version` is the `FEATURE.md` version the feature was applied/last updated at.
- `options` records the stack choices made for this app.
- The baseline is a feature like any other and appears here too.

## Freshness

Two mechanisms, matching the two kinds of feature content:

1. **Packaged features**: npm semver. Outdated `@appelent/*` dependencies surface via `pnpm outdated`; updating is a normal dependency bump.
2. **Described/scaffolded features**: the `FEATURE.md` `version` vs the version recorded in the app's `appelent.json`.

`/appelent status` inside an app reads `appelent.json`, compares recorded versions against the installed plugin's catalog, checks `@appelent/*` versions in `package.json`, and reports per feature: up to date, feature definition newer (with the changelog delta and an offer to `apply --update`), or package outdated. `--all` iterates the paths in the monorepo's `projects.json` (paths only, machine-specific, optional; missing paths are skipped).

## Distribution and Updates

The repo doubles as its own plugin marketplace.

- **Install (once per machine):** `claude plugin marketplace add AppElent/appelent-packages`, then `claude plugin install appelent@appelent`.
- **Update:** merge to master, then `claude plugin update appelent` (or the `/plugin` UI) wherever you work. Convention: bump `plugin.json` version in any PR that changes a feature.
- **Dev loop on the primary machine:** add the marketplace from the local path `D:\Dev\appelent-packages` instead of GitHub so skill edits are picked up immediately without pushing. Other machines point at GitHub.

No skill is ever copied into `~\.claude\skills` again.

## Multi-Agent Story (Codex and others)

The catalog needs no translation: `skills/<feature>/` folders are valid open-spec Agent Skills (plain markdown, `name`/`description` frontmatter), which Codex supports natively. Only distribution differs:

- **Claude Code:** the plugin.
- **Codex:** Codex discovers personal skills in `~/.codex/skills/`. A small one-time setup script in the monorepo creates Windows directory junctions from `~/.codex/skills/<feature>` to `D:\Dev\appelent-packages\skills\<feature>`. Same files on disk; `git pull` updates both agents at once. Implementation must verify whether a single junction of the whole `skills/` folder is discovered (nesting) or one junction per feature is required, and the setup script must be re-run when features are added (or the whole-folder junction used if supported).
- **Front door in Codex:** the `appelent` skill is invocable via `$appelent` or auto-match; only the slash-command registration is Claude-specific.
- **Web/cloud sessions (any vendor):** the app's own `appelent.json` plus its AGENTS.md/CLAUDE.md managed block point to `github.com/AppElent/appelent-packages`; agents read `FEATURE.md`/`SKILL.md` from GitHub. No committed mirrors.
- **Per-repo opt-in (future option):** the `.agents/skills/` root convention exists if a specific app ever needs to carry a skill without a global install; it is not part of the standard setup.

## Managed Blocks in Apps

The marker blocks in each app's `CLAUDE.md` and `AGENTS.md` stay but shrink to a few lines:

> This is an Appelent-managed app. Opted-in features and their options are recorded in `appelent.json`. Feature definitions live in the `appelent` plugin (locally installed) or `https://github.com/AppElent/appelent-packages` (`skills/<feature>/FEATURE.md`). Before adding functionality that could apply to multiple apps, check the feature catalog first; to add or update a feature, use `/appelent`.

The `baseline` feature owns stamping and refreshing these blocks (taking over from `custom-bootstrap`).

## Retirements

| Today | Fate |
| --- | --- |
| `~\.claude\appelent\capabilities.json` | Retired — the `skills/` folders are the catalog |
| `~\.claude\appelent\projects.json` | Retired — per-app truth is `appelent.json`; optional paths-only `projects.json` in the monorepo serves `status --all` |
| `~\.claude\appelent\managed-*.md`, `scripts\appelent-registry.mjs`, tests | Retired with the registry |
| Repo mirrors (`.claude/appelent/*`, mirrored skills in apps) | Retired — replaced by GitHub-readable catalog + shrunk managed blocks |
| `~\.claude\skills\add-cli`, `add-i18n`, `add-mcp-server` | Content migrates into `skills/<feature>/`; global copies deleted |
| `~\.claude\skills\custom-bootstrap` | Becomes the `baseline` feature; bootstrap = `/appelent apply baseline` + chosen features |
| `~\.claude\skills\audit-appelent-projects` | Becomes `/appelent status [--all]` |
| Project-specific skills in apps (e.g. `verify`, review skills) | Unchanged — they are app-local, not features |

Migration order (detail belongs to the implementation plan): plugin manifest first, migrate feature folders, front door, install plugin, then per-app on next touch — write `appelent.json`, shrink managed blocks, delete mirrors — and finally delete the global registry and skills.

## Error Handling

- **Requested option not in Stack:** the apply flow stops, says which options are supported, and offers to extend `FEATURE.md` first.
- **`appelent.json` claims a feature but evidence is missing** (or vice versa): `status` reports the mismatch and proposes the fix; it never silently edits the app.
- **Plugin not installed / catalog unreachable:** the managed block's GitHub URL is the fallback path for any agent.
- **`status --all` with stale paths:** missing paths are reported as skipped, never errors.

## Testing

- The plugin loads: `claude plugin validate` (manifest + marketplace) and a smoke check that `/appelent list` shows all features with correct stages.
- Apply flow: run `/appelent apply` for one packaged feature (i18n) and one documented feature (mcp) against a scratch app; verify wiring, `appelent.json` write, and same-commit behavior.
- Update flow: bump a `FEATURE.md` version with a changelog line; verify `status` flags the app and `apply --update` applies only the delta.
- Codex: verify junction discovery (`/skills` lists the features) on this machine.
- Retirement safety: after migration, `audit`-era files are gone and no skill references `~\.claude\appelent`.

## Out of Scope

- A standalone `@appelent/kit` CLI (shadcn-style). The folder/metadata conventions here (FEATURE.md frontmatter, appelent.json) are chosen so a CLI could be layered on later without restructuring.
- Renaming the repo. `appelent-packages` keeps its name until that is worth the churn.
- Building the future `mobile` feature; it only serves as the example of capturing a new topic.
