---
name: appelent-feature
description: Front door for the Appelent feature catalog (the /appelent:feature command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature/fold work into an existing one, braindump an idea to improve or add a feature (suggest), pick one back up for full brainstorming (suggestions), or triage-and-implement one or more suggestions directly (fix). For an app's installed-feature status or review passes, see the appelent-project skill (/appelent:project) instead.
---

# appelent-feature

Operate on the sibling feature folders of this skill: every directory next
to this one (`../<feature>/`) that is not `appelent-feature`, `appelent-project`,
`review-app`, `review-session`, or `upgrade-deps` is a feature, with
`FEATURE.md` (description, integer `version`, optional `package`
frontmatter) and `SKILL.md` (apply/update procedure).

## Locating the catalog repo checkout

`apply baseline`'s `projects.json` registration and `capture` (below) write
into this catalog repo's own git history — they need a writable local
checkout, not wherever this plugin happens to be loaded/cached from.
Resolve it in this order:

1. `$APPELENT_CATALOG_PATH`, if set.
2. The current working directory (or an ancestor), if it's already this
   catalog repo — i.e. has `.claude-plugin/marketplace.json` with
   `"name": "appelent"`.
3. `D:\Dev\appelent-packages`, the maintainer's local dev checkout, if it
   exists.
4. None found — stop and say so plainly: these operations need a local
   catalog repo checkout (set `APPELENT_CATALOG_PATH`, or run them from
   inside a clone of `AppElent/appelent-packages`). This is expected on
   Claude Code web sessions, which only check out the current app repo —
   skip these steps there, or do the catalog-repo edit from a separate web
   session opened on the catalog repo itself.

Subcommands (also reachable by natural language):

## help

For `help`, or when invoked with no/unrecognized arguments: explain the
subcommands below in one line each, then state how onboarding works: a new
or existing app joins the mechanism via `apply baseline`, after which
features are added à la carte with `apply <feature>`, and improvement ideas
can be braindumped anytime with `suggest`, resumed with `suggestions`, or
triaged-and-fixed with `fix`. Mention that `/appelent:project` covers an
app's installed-feature status and review passes.

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
repo checkout (see "Locating the catalog repo checkout" above) so `status
--all` covers it; commit that change in the catalog repo.

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
5. **Write the catalog files**, in the catalog repo checkout (see
   "Locating the catalog repo checkout" above):
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

## suggest <idea>

Braindump an idea to improve an existing catalog feature or add a new one,
as a GitHub issue — without interviewing the user or interrupting whatever
they're doing. Reachable via natural language, e.g. "suggest a feature
idea: X", "this feature should also...".

Same mechanism as `/appelent:project suggest` (see
`../appelent-project/SKILL.md` for the full procedure): the user's idea
becomes the issue title, the `catalog-suggestion` label is ensured/applied,
and it's always filed against `AppElent/appelent-packages` via `gh issue
create`, regardless of which repo is currently open. Exposed here too
because most feature-shaped ideas surface while browsing or applying the
catalog, not while working in an app.

## suggestions

List open braindumped ideas and resume one — same mechanism as
`/appelent:project suggestions` (see `../appelent-project/SKILL.md` for the
full procedure: list via `gh issue list --label catalog-suggestion`, let
the user pick one, hand its title/body to the `brainstorming` skill, then
offer to close the issue once that work concludes).

## fix <n> [n...]

Triage one or more braindumped suggestions with a lightweight
analyze-then-choose loop, instead of full brainstorming for every issue
regardless of size — same mechanism as `/appelent:project fix` (see
`../appelent-project/SKILL.md` for the full procedure: fetch each issue,
sketch a concrete solution and where it belongs, propose `brainstorm/plan`
vs `just go` per issue — defaulting to `brainstorm/plan` whenever the
sketch is genuinely uncertain — then implement or hand off accordingly).

For an app's installed-feature status or review passes (`review-app`/
`review-session`), see the `appelent-project` skill (`/appelent:project`).
