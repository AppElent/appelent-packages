# Appelent Managed Projects Design

Date: 2026-07-09

## Purpose

Appelent apps should share reusable functionality without forcing every repo to be identical. The goal is to make it clear which projects follow the Appelent baseline, which reusable capabilities they have, and where new generic functionality should live.

This design creates a global control plane for local Claude Code work and a committed repo-local mirror for browser/web environments that cannot access the local global files.

## Decisions

### 1. Global Control Plane

The canonical Appelent project registry lives under the global Claude config folder:

```text
C:\Users\ericj\.claude\appelent\
  projects.json
  capabilities.json
  managed-claude-section.md
  managed-agents-section.md
```

Reusable global skills live under:

```text
C:\Users\ericj\.claude\skills\
  custom-bootstrap\
  audit-appelent-projects\
  add-cli\
  add-i18n\
```

`projects.json` records managed repos and the capabilities enabled in each one:

```json
{
  "schemaVersion": 1,
  "projects": {
    "workouts": {
      "path": "D:\\Dev\\workouts",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth", "cli"]
    }
  }
}
```

`capabilities.json` records reusable functionality and its owner:

```json
{
  "schemaVersion": 1,
  "capabilities": {
    "auth": {
      "owner": "package",
      "package": "@appelent/auth"
    },
    "cli": {
      "owner": "capability-skill",
      "skill": "add-cli",
      "package": "@appelent/cli"
    },
    "i18n": {
      "owner": "capability-skill",
      "skill": "add-i18n",
      "status": "candidate"
    }
  }
}
```

A repo is managed because it appears in `projects.json`, not because it happens to live under `D:\Dev`.

### 2. Reuse Classification

Use this decision rule for shared work:

| Kind of reuse | Home | Examples |
| --- | --- | --- |
| Substantial identical runtime | `@appelent/*` package | `@appelent/auth`, future `@appelent/cli` |
| Baseline project config | `custom-bootstrap` | pnpm, Biome, scripts, CI, Wrangler, managed docs |
| Same setup but app-specific code | Capability skill | `add-cli`, `add-i18n`, future `add-mcp` |

Small snippets do not need packages. For example, a small Convex auth helper can be bootstrap-owned if it is not large enough to justify package publishing and versioning.

### 3. Registry Update Contract

Registry updates are part of each tool's done criteria.

`custom-bootstrap` must:

- Add the current repo to `projects.json` if missing.
- Set or refresh the repo baseline.
- Add baseline-provided capabilities such as `auth` when applicable.
- Stamp or refresh managed blocks in `CLAUDE.md` and `AGENTS.md`.
- Refresh the repo-local web mirror.

Capability skills such as `add-cli` and `add-i18n` must:

- Add their capability to `capabilities.json` if missing.
- Add the capability to the current repo's `projects.json` entry after successful setup.
- Update managed docs or capability notes when needed.
- Refresh the repo-local mirror when they change canonical capability metadata.

Managed repo instructions must include a standing rule: if an agent adds, removes, or generalizes cross-app functionality, it must update the Appelent registry files or explicitly explain why no registry change is needed.

### 4. Registry Enforcement

Add a global `audit-appelent-projects` skill or command. It reads the canonical registry and checks each managed repo for evidence.

It should verify:

- Repo path exists.
- `CLAUDE.md` contains the managed marker block.
- `AGENTS.md` contains the managed marker block.
- Baseline scripts and package-manager conventions exist.
- Expected package dependencies exist.
- Expected capability evidence exists, such as `cli/` and `test:cli` for `cli`.
- The registry does not list stale capabilities.
- The repo does not contain obvious unregistered capabilities.
- Repo-local mirror files are present and not stale.

Example report:

```text
workouts
  baseline: ok
  managed docs: ok
  mirror: ok
  capabilities:
    auth: ok
    cli: ok

roadmaps
  baseline: stale
  managed docs: AGENTS.md missing Appelent block
  mirror: stale
  capabilities:
    auth: ok
    i18n: detected but not registered
```

The audit should offer fixes instead of silently changing everything: update registry entries, refresh marker blocks, refresh mirrors, rerun `custom-bootstrap`, or run the relevant capability skill.

### 5. Managed Repo Instructions

`custom-bootstrap` owns marker blocks in `CLAUDE.md` and `AGENTS.md`. Marker blocks allow updates without clobbering project-specific documentation.

Canonical section templates live in:

```text
C:\Users\ericj\.claude\appelent\managed-claude-section.md
C:\Users\ericj\.claude\appelent\managed-agents-section.md
```

`CLAUDE.md` block:

```md
<!-- appelent-managed:start -->
## Appelent Managed Project

This repo follows the shared Appelent project baseline.

Source of truth:
- `C:\Users\ericj\.claude\appelent\projects.json`
- `C:\Users\ericj\.claude\appelent\capabilities.json`
- `C:\Users\ericj\.claude\skills`

Web/browser fallback:
- `.claude\appelent`
- `.claude\skills`

Before adding functionality that could apply to multiple apps, check whether it belongs in:
- an existing or new `@appelent/*` package
- `custom-bootstrap`
- a capability skill such as `add-cli` or `add-i18n`

If you add, remove, or generalize cross-app functionality, update the Appelent registry files or explain why no registry change is needed.
<!-- appelent-managed:end -->
```

`AGENTS.md` block:

```md
<!-- appelent-managed:start -->
## Appelent Managed Project

Read `CLAUDE.md` first.

Primary local source:
- `C:\Users\ericj\.claude\appelent`
- `C:\Users\ericj\.claude\skills`

Web/browser fallback committed in this repo:
- `.claude\appelent`
- `.claude\skills`

When adding generic functionality, prefer existing `@appelent/*` packages, bootstrap conventions, or capability skills before creating a new local-only pattern.

If global and repo-local instructions differ, prefer the global source locally. In web/browser environments, use the repo-local mirror and flag the drift.
<!-- appelent-managed:end -->
```

### 6. Global Canonical Plus Repo Mirror

Browser/web environments may not see `C:\Users\ericj\.claude`, so each managed repo carries a committed mirror:

```text
repo/
  .claude/
    appelent/
      projects.managed.json
      capabilities.managed.json
    skills/
      add-cli/
      add-i18n/
      review-app/
      review-session/
      verify/
```

Rules:

- Global files are canonical on the local machine.
- Repo-local files are committed mirrors for browser/web agents.
- `custom-bootstrap` refreshes the mirror from global.
- `audit-appelent-projects` reports stale mirrors.
- A web agent may use or edit the mirror.
- If a web agent changes a mirrored skill in a reusable, non-project-specific way, it must flag that the change should be ported back to the global skill.
- Project-specific skills, especially `verify`, can remain repo-local only.

The mirror should include only the registry snapshot and skills useful to the repo. It does not need every global skill.

## Initial Capability Handling

`auth` is an existing package-owned capability via `@appelent/auth`.

`cli` is a likely package plus capability-skill split:

- `@appelent/cli` owns substantial identical runtime such as auth flow, config store, Convex client factory, output formatting, and command registration plumbing.
- `add-cli` owns app-specific setup, command skeletons, route mounting, scripts, and registry updates.

`i18n` should start as a capability skill candidate:

- `add-i18n` owns library choice, folder conventions, route/provider wiring, message file structure, and docs.
- A package should only be introduced later if multiple apps prove there is substantial identical runtime worth versioning.

## Out of Scope

This design does not implement the registry, audit skill, or capability skills. It defines where they live, what they own, and how they stay synchronized.

It also does not require moving unrelated repos out of `D:\Dev`; the registry is the source of truth for managed status.

## Implementation Notes

- `projects.managed.json` mirrors the full registry. A full snapshot is simpler for web agents because they can see the rest of the fleet and infer reusable patterns.
- Audit is read-only by default. A later explicit fix mode can apply safe mechanical updates, but the first implementation should report drift and recommend commands.
- `custom-bootstrap` detects stale marker blocks by exact text comparison between the marker comments. This is sufficient for the first version and avoids parsing project-specific prose.
