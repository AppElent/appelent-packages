---
name: appelent-project
description: App/project-side companion to the Appelent feature catalog (the /appelent:project command routes here). Use when the user wants to list an app's installed features, check installed-feature status/freshness against the catalog (incl. an --all sweep across registered projects), note an improvement idea for later (suggest) or pick one back up (suggestions) — also reachable via /appelent:feature suggest/suggestions — run a review pass (review-app/review-session), safely upgrade dependencies (upgrade-deps), or copy plugin skill folders into this app (sync-skills). For catalog-side operations (list available features, show, apply, capture), see the appelent-feature skill (/appelent:feature) instead.
---

# appelent-project

Operates on the current app repo (its `appelent.json`, `package.json`, and
source) and, for `status --all`, on `projects.json` in the catalog repo
checkout — see "Locating the catalog repo checkout" in the `appelent-feature`
skill (`../appelent-feature/SKILL.md`) for how to find it; the same
resolution order applies here.

Subcommands (also reachable by natural language):

## help

For `help`, or when invoked with no/unrecognized arguments: explain the
subcommands below in one line each, including `upgrade-deps` (safely
upgrade this app's dependencies) and `sync-skills <name>...` (copy plugin
skill folders into this app's `.claude/skills/`). Mention that
`/appelent:feature` covers catalog-side operations (list available
features, show, apply, capture) and also exposes `suggest`/`suggestions`
as an alternate entry point to the same braindump mechanism.

## list

Read the current app's `appelent.json` and print a table of its installed
features: name, recorded version, options. This does not compare against
the catalog — that's what `status` is for. If `appelent.json` is missing,
say the app isn't onboarded yet and suggest `/appelent:feature apply
baseline`.

## status [--all]

For the current app (or for each path in the catalog repo's
`projects.json` when `--all`; skip and report missing paths, never fail).
Plain `status` only reads the plugin's own bundled `FEATURE.md` files
(`../<feature>/FEATURE.md`, same as `show`), so it works anywhere the
plugin is loaded, including Claude Code web sessions. `--all` additionally
needs `projects.json` from a local catalog repo checkout (see "Locating
the catalog repo checkout" in `appelent-feature`) — skip it there if none
is found.

1. Read `appelent.json`; for each recorded feature compare its version to
   the catalog FEATURE.md version. Report: up to date, or behind (show
   the Changelog lines between the versions and offer `/appelent:feature
   apply --update`).
2. For packaged features, check `@appelent/*` versions in the app's
   `package.json` against the workspace package versions; report outdated.
3. Report mismatches both ways: recorded-but-no-evidence and
   evidence-but-not-recorded (e.g. `@appelent/i18n` in dependencies but no
   `i18n` entry). Propose the fix; never silently edit the app.

## suggest <idea>

Zero-friction braindump: log an improvement idea for the catalog mechanism
(or a specific feature) as a GitHub issue, without interviewing the user or
interrupting whatever they're doing. Reachable via natural language, e.g.
"note an idea: X", "suggest that we...". This is the canonical procedure —
`/appelent:feature suggest` is an alternate entry point to the same steps
below.

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
   as `apply`/`capture` always writing into the catalog checkout.
5. No follow-up questions. Confirm the issue was filed (report the issue
   URL `gh issue create` prints) and stop.

## suggestions

List open braindumped ideas and resume one. Reachable via natural
language, e.g. "what improvement ideas do I have?", "let's work on one of
my suggestions". This is the canonical procedure — `/appelent:feature
suggestions` is an alternate entry point to the same steps below.

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

## review-app

Invoke the `review-app` skill against the current app, using any argument
text as its scope (e.g. `review-app mobile`, `review-app what we just
built`) exactly as `review-app` itself interprets scope arguments. No
extra logic here — this subcommand exists purely as a discoverable entry
point alongside the app's own natural-language triggers for that skill.

## review-session

Invoke the `review-session` skill against the current app. Same
pass-through behavior as `review-app`: no extra logic, just a discoverable
entry point under `/appelent:project`.

## upgrade-deps

Invoke the `upgrade-deps` skill against the current app. Same
pass-through behavior as `review-app`/`review-session`: no extra logic,
just a discoverable entry point alongside natural-language triggers like
"upgrade dependencies" or "update packages".

## sync-skills <name> [name...]

Copy one or more of the plugin's own skill folders verbatim into this
app's `.claude/skills/<name>/` — `SKILL.md` and any accompanying files
(e.g. `references/`), unmodified. Resolves `<name>` the same way
`appelent-feature`'s `show` does (`../<name>/` relative to this skill).
Works for any sibling skill, catalog features included (auth/cli/i18n/
mcp) as well as the workflow skills (review-app/review-session/
upgrade-deps) — this is a raw copy, not `apply <feature>`: no package
install, wiring, or `appelent.json` recording.

1. No arguments: list the plugin's skill folders except
   `appelent-feature`/`appelent-project` (copying the front doors into an
   app is never useful) and ask which to copy.
2. For each named skill: if `.claude/skills/<name>/` doesn't exist yet in
   the app, copy `../<name>/` there directly. If it exists and is
   identical, report "already in sync" and skip. If it exists and
   differs, show what would change and ask before overwriting — never
   silently clobber a hand-edited project-local copy.
3. Report one line per skill: copied, already in sync, or skipped
   (declined overwrite).
