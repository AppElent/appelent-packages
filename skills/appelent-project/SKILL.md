---
name: appelent-project
description: App/project-side companion to the Appelent feature catalog (the /appelent:project command routes here). Use when the user wants to list an app's installed features, check installed-feature status/freshness against the catalog (incl. an --all sweep across registered projects), file a GitHub issue against this app's own repo (issue — bug/idea/docs, type label inferred), list and resume open issues via full brainstorming (issues), or triage-and-implement one or more issues directly (fix) — all three are also reachable via /appelent:feature, which files against the catalog repo instead — run a review pass (review-app/review-session), safely upgrade dependencies (upgrade-deps), or make fallback-only plain-markdown skill copies (sync-skills). For catalog-side operations (list available features, show, apply, capture), see the appelent-feature skill (/appelent:feature) instead.
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
subcommands below in one line each, including `issue <text>` (file a GitHub
issue against this app's own repo, type label inferred), `issues` (list &
resume open issues), `fix <n>` (triage-and-implement issues directly),
`upgrade-deps` (safely upgrade this app's dependencies) and `sync-skills
<name>...` (fallback-only plain-markdown copies for environments without
the plugin).
Mention that `/appelent:feature` covers catalog-side operations (list
available features, show, apply, capture) and also exposes the same
`issue`/`issues`/`fix` verbs as alternate entry points that file against the
catalog repo instead of this app.

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

## Issues: target repo and type labels

`issue`/`issues`/`fix` all operate on GitHub issues. Two things are shared
across the three verbs; the per-verb steps below refer back to this section.

**Target repo.** Every `gh` call below uses `<target repo>`, resolved by
which front door invoked the verb:

- Via **`/appelent:project`** (or app-side natural language) → **this app's
  own GitHub repo**. Resolve it by running, in the app dir,
  `gh repo view --json nameWithOwner -q .nameWithOwner` (this reads the
  `origin` remote). If it can't resolve — no `origin` remote, `gh` not
  authenticated, or issues disabled on the repo — report the failure from
  `gh` plainly and **stop**. Never silently fall back to the catalog repo.
- Via **`/appelent:feature`** (or feature/catalog-shaped natural language) →
  `AppElent/appelent-packages` (the catalog repo), fixed. See
  `../appelent-feature/SKILL.md` for that entry point.

**Type label (inferred, not asked).** Classify the issue text into exactly
one type and apply that as the label — this stays zero-friction, so infer
and apply rather than interviewing the user:

| Label | When | Ensure-exists color / description |
|---|---|---|
| `bug` | broken/incorrect behavior, an error, a crash, a regression ("X doesn't work / is wrong") | `d73a4a` — "Something isn't working" |
| `documentation` | docs / README / comments / `FEATURE.md` wording or examples missing or wrong | `0075ca` — "Improvements or additions to documentation" |
| `enhancement` | a new capability, improvement, or idea — **the default when ambiguous** | `a2eeef` — "New feature or request" |
| `question` | an open question that needs an answer before anything is built | `d876e3` — "Further information is requested" |

Ensure the chosen label exists before applying it:
`gh label list --repo <target repo> --search <label>`; only if absent,
`gh label create <label> --repo <target repo> --color <color>
--description "<description>"` using the row above. These are GitHub's
default labels, so this is usually a no-op.

## issue <text>

Zero-friction: file `<text>` as a GitHub issue against `<target repo>`,
without interviewing the user or interrupting whatever they're doing.
Reachable via natural language, e.g. "note an idea: X", "suggest that
we...", "report a bug: Y", "file an issue for Z". This is the canonical
procedure — `/appelent:feature issue` is an alternate entry point to the
same steps below (differing only in `<target repo>`).

1. Use the user's one-line text as the issue title. If their message
   included more context, use it as the issue body; otherwise leave the
   body empty.
2. Infer the type label from the text and ensure it exists — see "Issues:
   target repo and type labels" above.
3. File the issue: `gh issue create --repo <target repo> --title "<text>"
   --body "<context or empty string>" --label <inferred label>`.
4. No follow-up questions. Report the outcome — the issue URL `gh issue
   create` prints and which label was applied, e.g.
   `Filed #42 (bug) → AppElent/satisfactory: <title>` — and stop. If the
   inference was a guess, say so briefly so the user can relabel on GitHub.

## issues

List open issues and resume one via full brainstorming. Reachable via
natural language, e.g. "what issues do I have?", "let's work on one of my
issues". This is the canonical procedure — `/appelent:feature issues` is an
alternate entry point to the same steps below (differing only in `<target
repo>`).

1. List open candidates: `gh issue list --repo <target repo> --state open`
   (no label filter — show issues of every type, so nothing is hidden;
   this also surfaces any legacy `catalog-suggestion`-labeled issues).
   Show the user each issue's number, title, and type label.
2. Let the user pick one, by number or by naming it. If their answer
   matches more than one listed issue, or none, ask them to pick by number
   instead of guessing.
3. Fetch the full issue: `gh issue view <n> --repo <target repo>`.
4. Use that issue's title and body as the starting context for the
   `brainstorming` skill, in place of a blank user prompt — the rest of
   the flow (clarifying questions, design, plan) proceeds exactly as it
   would for any other brainstorming request.
5. Once that work concludes, offer to close the issue: `gh issue close <n>
   --repo <target repo>`. Never close it without asking — same "propose,
   don't silently act" principle `status` and `apply` already follow for
   app-side edits.

## fix <n> [n...]

Triage one or more issues with a lightweight analyze-then-choose loop,
instead of going straight into full brainstorming for every issue
regardless of how simple it is — a good fit for `bug`-type issues that
often just need a direct fix. Reachable via natural language, e.g. "fix
issue #3", "let's knock out a couple of these". `/appelent:feature fix` is
an alternate entry point to the same steps below (differing only in
`<target repo>`).

1. For each issue number given: `gh issue view <n> --repo <target repo>`
   to get its title/body/label.
2. **Small analysis per issue**, done by you, not delegated to a skill:
   figure out where the change actually belongs — this app repo, the
   catalog repo checkout (see "Locating the catalog repo checkout" in
   `../appelent-feature/SKILL.md`), a specific feature's `FEATURE.md`/
   `SKILL.md`, or somewhere else entirely — and sketch one concrete
   solution: which files change, roughly how, and any real open question
   or risk you hit while sketching it.
3. **Propose, then ask.** Show the user the sketch per issue and ask
   whether to `brainstorm/plan` it or `just go`:
   - If step 2 produced a single confident, low-risk solution, offer both
     options but default the recommendation to `just go`.
   - If step 2 surfaced a genuine design choice, ambiguity, or a solution
     you're not confident in, say so and recommend `brainstorm/plan`
     instead of asking — same "flag uncertainty explicitly" principle as
     everywhere else.
4. **`brainstorm/plan`** — hand off exactly like `issues` above (steps
   4-5): the issue's title/body/your analysis as context for the
   `brainstorming` skill, then offer to close the issue once that
   concludes.
5. **`just go`** — implement the sketched solution directly in the
   repo/location identified in step 2, following the normal skills that
   would apply to that kind of change anyway (e.g. `test-driven-development`
   for app code, `pnpm validate:catalog` for catalog edits). No
   brainstorming/writing-plans ceremony. Once it's done and verified,
   offer to close the issue — never close it without asking.
6. With multiple issue numbers: work through steps 1-3 for each before
   acting on any of them, so the user sees every proposal up front and can
   route each one (`brainstorm/plan` vs `just go` vs skip) independently,
   rather than being surprised mid-batch.

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

Fallback-only: copy one or more of the plugin's own skill folders verbatim
into this app's `.claude/skills/<name>/` — `SKILL.md` and any accompanying
files (e.g. `references/`), unmodified. Use this only when the Appelent
plugin is unavailable in the target environment and committed
plain-markdown skills are still needed. Normal app projects should invoke
the plugin-provided skills directly.

Resolves `<name>` the same way `appelent-feature`'s `show` does
(`../<name>/` relative to this skill). Works for any sibling skill, catalog
features included (auth/cli/i18n/mcp) as well as workflow skills
(review-app/review-session/upgrade-deps) — this is a raw copy, not `apply
<feature>`: no package install, wiring, or `appelent.json` recording.

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
