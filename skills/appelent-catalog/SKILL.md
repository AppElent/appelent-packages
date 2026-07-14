---
name: appelent-catalog
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature/design decision, or check an app's feature status/freshness.
---

# appelent-catalog

Operate on the sibling feature folders of this skill: every directory next
to this one (`../<feature>/`) that is not `appelent-catalog` is a feature, with
`FEATURE.md` (description, integer `version`, optional `package`
frontmatter) and `SKILL.md` (apply/update procedure).

Subcommands (also reachable by natural language):

## help

For `help`, or when invoked with no/unrecognized arguments: explain the
subcommands below in one line each, then state how onboarding works: a new
or existing app joins the mechanism via `apply baseline`, after which
features are added à la carte with `apply <feature>`.

## list

For each feature folder read the FEATURE.md frontmatter and print a table:
name, description, version, stage. Stage rules:

- `packaged` — frontmatter has `package:`
- `guided` — no package, but SKILL.md contains a numbered apply procedure
- `documented` — everything else

If run inside an app repo with an `appelent.json`, add an "installed"
column with the app's recorded version per feature.

## show <feature>

Read `../<feature>/FEATURE.md` and summarize it: What, Stack (including
supported options), Architecture, Configuration, and the Changelog tail.

## apply <feature> [options...]

1. Read `../<feature>/FEATURE.md`. Check requested options (e.g. "using
   agents on cloudflare" for mcp) against the Stack section. If an option
   is not described there, STOP: tell the user which options are
   supported and offer to extend FEATURE.md first (in the catalog repo,
   bumping `version` with a Changelog line). Never wire undescribed stacks.
2. Follow `../<feature>/SKILL.md` to do the wiring in the current app.
3. Record the result in `appelent.json` at the app root, in the same
   commit as the wiring: `"<feature>": { "version": <FEATURE.md version>,
   "options": { ... } }` (omit `options` if none were chosen). Create the
   file with `{ "features": {} }` shape if missing.

With `--update`: read the app's recorded version, apply only the
Changelog deltas between recorded and current, then update the recorded
version.

When the feature is `baseline` (this is how a project is onboarded into
the mechanism — new scaffold or existing unmanaged app alike), finish by
offering to add the app's absolute path to `projects.json` in the catalog
repo checkout (`D:\Dev\appelent-packages`) so `status --all` covers it;
commit that change in the catalog repo.

## capture <topic>

Interview the user about the design decision (what, stack, architecture,
configuration), then in the catalog repo checkout
(`D:\Dev\appelent-packages`) create `skills/<topic>/FEATURE.md` at
`version: 1` following the contract (frontmatter name/version/description
+ sections What/Stack/Architecture/Configuration/Changelog) and a stub
`skills/<topic>/SKILL.md` whose body says to read FEATURE.md before
building `<topic>` functionality. Run `pnpm validate:catalog` there, then
commit both files.

## status [--all]

For the current app (or for each path in the catalog repo's
`projects.json` when `--all`; skip and report missing paths, never fail):

1. Read `appelent.json`; for each recorded feature compare its version to
   the catalog FEATURE.md version. Report: up to date, or behind (show
   the Changelog lines between the versions and offer `apply --update`).
2. For packaged features, check `@appelent/*` versions in the app's
   `package.json` against the workspace package versions; report outdated.
3. Report mismatches both ways: recorded-but-no-evidence and
   evidence-but-not-recorded (e.g. `@appelent/i18n` in dependencies but no
   `i18n` entry). Propose the fix; never silently edit the app.
