---
name: appelent-catalog
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature or fold work into an existing one, note an improvement idea for later (suggest) or pick one back up (suggestions), or check an app's feature status/freshness.
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

## suggest <idea>

Zero-friction braindump: log an improvement idea for the catalog mechanism
(or a specific feature) as a GitHub issue, without interviewing the user or
interrupting whatever they're doing. Reachable via natural language, e.g.
"note an idea: X", "suggest that we...".

1. Use the user's one-line idea as the issue title. If their message
   included more context, use it as the issue body; otherwise leave the
   body empty.
2. Ensure the label exists: `gh label list --repo AppElent/appelent-packages
   --search catalog-suggestion`. If it's not there, create it:
   `gh label create catalog-suggestion --repo AppElent/appelent-packages
   --description "Braindumped improvement idea for the appelent-packages
   catalog mechanism" --color ededed`.
3. File the issue: `gh issue create --repo AppElent/appelent-packages
   --title "<idea>" --body "<context or empty string>" --label
   catalog-suggestion`.
4. Always targets `AppElent/appelent-packages` via `--repo`, regardless of
   which repo the user is currently working in — same cross-repo behavior
   as `capture` always writing into the catalog checkout.
5. No follow-up questions. Confirm the issue was filed (report the issue
   URL `gh issue create` prints) and stop.

## suggestions

List open braindumped ideas and resume one. Reachable via natural
language, e.g. "what improvement ideas do I have?", "let's work on one of
my suggestions".

1. List open candidates: `gh issue list --repo AppElent/appelent-packages
   --label catalog-suggestion --state open`. Show the user each issue's
   number and title.
2. Let the user pick one, by number or by naming it. If their answer
   matches more than one listed issue, or none, ask them to pick by number
   instead of guessing.
3. Fetch the full issue: `gh issue view <n> --repo
   AppElent/appelent-packages`.
4. Use that issue's title and body as the starting context for the
   `brainstorming` skill, in place of a blank user prompt — the rest of
   the flow (clarifying questions, design, plan) proceeds exactly as it
   would for any other brainstorming request.
5. Once that work concludes, offer to close the issue: `gh issue close <n>
   --repo AppElent/appelent-packages`. Never close it without asking —
   same "propose, don't silently act" principle `status` and `apply`
   already follow for app-side edits.

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
