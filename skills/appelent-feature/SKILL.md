---
name: appelent-feature
description: Front door for the Appelent feature catalog (the /appelent:feature command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), or capture a new feature/fold work into an existing one. For an app's installed-feature status, improvement braindumps, or review passes, see the appelent-project skill (/appelent:project) instead.
---

# appelent-feature

Operate on the sibling feature folders of this skill: every directory next
to this one (`../<feature>/`) that is not `appelent-feature`, `appelent-project`,
`review-app`, or `review-session` is a feature, with `FEATURE.md` (description,
integer `version`, optional `package` frontmatter) and `SKILL.md` (apply/update
procedure).

Subcommands (also reachable by natural language):

## help

For `help`, or when invoked with no/unrecognized arguments: explain the
subcommands below in one line each, then state how onboarding works: a new
or existing app joins the mechanism via `apply baseline`, after which
features are added à la carte with `apply <feature>`. Mention that
`/appelent:project` covers an app's installed-feature status, improvement
braindumps, and review passes.

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

Fold a design decision into the catalog — either a brand-new feature or an
addition to an existing one. Reachable via natural language, e.g. "capture
what we just built as `<topic>`, ask about anything unclear."

1. **Resolve the target.** Check for `../<topic>/` next to this skill.
   - Exists → extend mode (version bump on that feature).
   - Doesn't exist → new mode (fresh feature at version 1).
   - If `<topic>` doesn't exist but the session's work looks like it
     belongs to a different existing feature, ask the user to confirm the
     target before continuing.
2. **Draft from the session.** If this session built or extended
   something, summarize its actual decisions — what, stack, architecture,
   configuration, files touched — as the first draft. If there is no
   session work to draw from (e.g. run from the catalog repo itself, or
   capturing an idea not yet built), fall back to interviewing the user
   from scratch as before.
3. **Ground the draft.** For concrete claims in the draft (file paths,
   package names, config keys), check them against the current app repo's
   `git diff`/`git log` and actual file contents. Flag anything that
   doesn't check out to the user instead of writing it down as fact — this
   matters most in a long or compacted session where early details may be
   remembered fuzzily.
4. **Fill gaps.** Ask the user targeted questions only for what's still
   missing or uncertain after steps 2-3, not a full interview.
5. **Write the catalog files**, in the catalog repo checkout
   (`D:\Dev\appelent-packages`):
   - New mode: create `skills/<topic>/FEATURE.md` at `version: 1`
     following the contract (frontmatter name/version/description +
     sections What/Stack/Architecture/Configuration/Changelog) and a stub
     `skills/<topic>/SKILL.md` whose body says to read FEATURE.md before
     building `<topic>` functionality.
   - Extend mode: increment the existing `FEATURE.md`'s `version`, append
     a Changelog line describing the addition, and update the
     Stack/Architecture/Configuration sections in place so the doc stays a
     coherent description of current state (not an append-only log).
6. Run `pnpm validate:catalog` in the catalog repo, then commit the
   `FEATURE.md`/`SKILL.md` changes there.
7. **Record it in the app.** Write/update the app's `appelent.json`: new
   mode adds `"<topic>": { "version": 1, "options": {...} }`; extend mode
   bumps the existing entry's `"version"` to match. Create the file with
   `{ "features": {} }` shape first if it doesn't exist. This is a
   separate commit in the app repo (a different repo from the catalog
   checkout) — offer it, never make it silently.

For an app's installed-feature status, improvement braindumps
(`suggest`/`suggestions`), or review passes (`review-app`/`review-session`),
see the `appelent-project` skill (`/appelent:project`).
