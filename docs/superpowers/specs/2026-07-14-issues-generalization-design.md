# Issues Generalization Design

Date: 2026-07-14

Extends: `skills/appelent-project/SKILL.md` (canonical) and
`skills/appelent-feature/SKILL.md` (alternate entry point), superseding the
`suggest`/`suggestions` mechanism from
`2026-07-14-catalog-suggestions-design.md`.

## Purpose

The `suggest`/`suggestions`/`fix` triad hardcoded two assumptions that
limited it to "catalog improvement ideas": every issue always targeted
`AppElent/appelent-packages`, and every issue always carried the same
`catalog-suggestion` label. That made it unusable for filing issues against
an app's own repo, and useless for distinguishing a bug report from a docs
gap from a feature idea.

This generalizes the triad into a repo-aware, typed **issues** capability:
`/appelent:project` now files against the current app's own GitHub repo;
`/appelent:feature` keeps filing against the catalog repo; and the label
applied to each issue is inferred from its text instead of fixed.

## Verb rename

`suggest <idea>` → `issue <text>`, `suggestions` → `issues`, `fix <n>`
unchanged. Natural-language reach stays broad — "suggest…", "report a
bug…", "file an issue…", "note an idea…" all route to `issue`.

## Target-repo resolution

Added once, above the three verbs in `skills/appelent-project/SKILL.md`
("Issues: target repo and type labels"), and referenced by every `gh` call
as `<target repo>`:

- Via `/appelent:project` (or app-side natural language) → the current
  app's own GitHub repo, resolved with `gh repo view --json nameWithOwner
  -q .nameWithOwner` run in the app dir (reads the `origin` remote). If
  that fails — no `origin` remote, `gh` not authenticated, issues disabled
  — report the failure plainly and stop. Never fall back to the catalog
  repo silently.
- Via `/appelent:feature` (or feature/catalog-shaped natural language) →
  `AppElent/appelent-packages`, fixed, same as before.

This is the only difference between the two front doors; both point at the
same canonical procedure in `skills/appelent-project/SKILL.md`.

## Label inference

Classify the issue text into exactly one type, in order of specificity:

| Label | When | Color / description |
|---|---|---|
| `bug` | broken/incorrect behavior, an error, a crash, a regression | `d73a4a` — "Something isn't working" |
| `documentation` | docs/README/comments/`FEATURE.md` wording or examples missing or wrong | `0075ca` — "Improvements or additions to documentation" |
| `enhancement` | a new capability, improvement, or idea — the default when ambiguous | `a2eeef` — "New feature or request" |
| `question` | an open question that needs an answer before anything is built | `d876e3` — "Further information is requested" |

Ensure-exists per label, same pattern as the old `catalog-suggestion`
label: `gh label list --repo <target repo> --search <label>`, only
`gh label create ... --color <color> --description "<description>"` if
absent. These are GitHub's own default labels, so ensure-exists is usually
a no-op.

Inference happens automatically — no follow-up question, to preserve the
original zero-friction braindump spirit. After filing, report which label
was applied (e.g. `Filed #42 (bug) → AppElent/satisfactory: <title>`) so
the user can relabel on GitHub if the guess was wrong.

## `issues` and `fix` listings

`gh issue list --repo <target repo> --state open` drops the old
`--label catalog-suggestion` filter, so every open issue in the target repo
is visible regardless of type — including any legacy
`catalog-suggestion`-labeled issues left over from before this change. Each
listed issue is annotated with its type label. The rest of the resume flow
(`issues`: pick → seed `brainstorming` → offer close) and the triage loop
(`fix`: analyze → `brainstorm/plan` vs `just go` → offer close) are
unchanged — they were already repo-agnostic; only the repo and label
references needed to change.

## Error Handling

- **`gh repo view` fails in the app dir** (no `origin` remote, `gh` not
  authenticated, issues disabled): report the failure plainly and stop.
  Never silently fall back to the catalog repo — that would silently
  misfile an app-specific issue into the wrong repo's backlog.
- **`gh` not authenticated / no network for issue create/list/view:**
  report the failure from `gh` directly; no silent retry, no local-file
  fallback.
- **Ambiguous pick** in `issues`: ask the user to clarify by number, same
  as before.
- **Label doesn't exist yet:** created on first use per label, same
  ensure-exists pattern as before; never fails because of a missing label.
- **Ambiguous type text:** default to `enhancement`, never block on
  classification.

## Testing

No runtime here — this is prose in `SKILL.md` files that shapes agent
behavior. Verification is a manual walkthrough:

1. From an app checkout, `/appelent:project issue "settings button is
   misaligned on mobile"` → a `bug`-labeled issue filed in the app's own
   repo, reported as `#N (bug) → <repo>`.
2. `/appelent:feature issue "baseline apply should also do Y"` → an
   `enhancement`-labeled issue in `AppElent/appelent-packages`.
3. `/appelent:project issue "README setup steps are out of date"` → a
   `documentation`-labeled issue.
4. In a repo lacking a `bug` label, the first matching `issue` call creates
   it; a second call of the same type doesn't duplicate or error.
5. `/appelent:project issues` lists open issues in the app repo; picking
   one seeds `brainstorming` from its title/body. `/appelent:feature fix
   <n>` runs the triage loop against a catalog issue.
6. `/appelent:project issue "x"` in a dir with no GitHub `origin` remote →
   reports the resolution failure and stops, no catalog fallback.

## Out of Scope

- Auto-closing issues or any other unattended GitHub write — unchanged,
  always ask.
- A local-file backlog — GitHub issues remain the single store.
- Proactively prompting for issues inside `apply`/other subcommands.
- Migrating or bulk-relabeling existing `catalog-suggestion` issues — they
  stay visible via the unfiltered listing.
