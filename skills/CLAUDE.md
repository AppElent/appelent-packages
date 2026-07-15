# Authoring SKILL.md / FEATURE.md

Every feature is `skills/<feature>/FEATURE.md` + `skills/<feature>/SKILL.md`.
`FEATURE.md` is the catalog manifest (frontmatter + five required `##`
sections); `SKILL.md` is the executable procedure Claude follows. `pnpm
validate:catalog` (run from the repo root) enforces the contract below —
run it after every edit here, it's cheap and catches frontmatter/heading
mistakes before they reach a PR.

## `FEATURE.md` contract

- Frontmatter: `name` (must equal the folder name), `version` (positive
  integer, `/^[1-9]\d*$/`, no leading zero or decimal), `description`, and
  optional `package: "@appelent/<name>"` only if `packages/<name>/` ships
  runtime code with a matching `package.json` `"name"`.
- Body: exactly `## What`, `## Stack`, `## Architecture`, `## Configuration`,
  `## Changelog` as `##`-level headings, in that order.
- `## Changelog` is newest-first, one bullet per version bump: `- <n> —
  <what changed and, if non-obvious, why>`. When you bump `version`, also
  update `## Stack`/`## Architecture`/`## Configuration` **in place** so
  they describe current state — the changelog is the history, the other
  sections are not an append-only log.
- Bumping `version` on an existing feature almost always means updating a
  test in `tests/catalog.test.mjs` that pins the current version via regex
  (e.g. baseline's `/^version: N$/m` assertion) — check for one before
  calling a version bump done.

## `SKILL.md` conventions

No enforced schema beyond frontmatter (`name` + `description` — the
`description` is the trigger text Claude Code uses to auto-load the skill,
write it as "use when X" prose covering the situations that should load
this skill). Body conventions, inferred from the existing features
(`baseline` is the largest, most consistent example):

- A feature with a step-by-step apply procedure uses `## Task` containing
  `### N. Title` numbered sections — `appelent-feature`'s `steps <feature>`
  subcommand parses these headings directly out of the file at runtime, so
  there's no separate manifest of step numbers to keep in sync. Appending a
  new `### N. Title` section is sufficient for it to show up; **don't
  renumber existing steps** once any app may have recorded a partial apply
  (`appelent.json`'s `"<feature>": { "steps": [n, ...] }`) against the old
  numbers — append new steps at the end instead, even if that reads a
  little out of order next to an "on request only" step like i18n's.
- Within a step, prefer `- **Bold lead-in phrase.** Explanation…` bullets
  (a short label, then the detail) over bare prose paragraphs — scan-first,
  read-second. Nest a fenced code block under a bullet at the same 2-space
  indent as the bullet's continuation text when the step needs to show
  exact file contents to stamp/merge.
- A checklist of independent, individually-completable sub-items (baseline
  step 11's Claude Code workflow layer is the example) uses `- [ ]
  **(a) Label** …` lettered items instead of plain bullets — reach for this
  only when the items are genuinely a checklist, not for ordinary
  explanatory bullets.
- State the *why*, not just the *what*, for anything non-obvious — a
  workaround for a specific bug, a value that looks arbitrary without
  context, a link to the upstream issue that forced a design choice (see
  baseline step 15's PWA recipe for an example: it explains why
  `vite-plugin-pwa` doesn't work here, with a link, rather than just saying
  "use workbox-build instead").
- "Merge, don't clobber" is baseline's phrase but the norm across every
  guided feature: describe how to detect existing/partial state before
  describing what to add, and never silently overwrite something that
  looks like an intentional prior customization — flag it instead.

## This plugin has no other instruction surface

There is no per-app-independent `CLAUDE.md` read by this plugin itself, and
no hidden config beyond what's in `skills/`. If a future contributor or
agent goes looking for "where does the behavior for X come from" and it's
not in `SKILL.md` (or a `references/*.md` file a `SKILL.md` explicitly
links to — see `skills/mcp/references/`), it doesn't exist yet; write it
into the relevant `SKILL.md` rather than assuming an implicit convention.
