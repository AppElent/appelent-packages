# Self-Improving Skills Design

Date: 2026-07-15

Extends: every `skills/*/SKILL.md`, building on the issues mechanism from
`2026-07-14-issues-generalization-design.md`.

Supersedes: the "Proactively prompting for issues inside `apply`/other
subcommands" out-of-scope line in that spec. Prompting inside subcommands is now
the point — see "Reversal" below.

## Purpose

The plugin could already file issues (`issue`/`issues`/`fix`), but only when a
human remembered to. Skill quality problems — an ambiguous instruction, a code
example that no longer works, a decision left open that two apps resolve
differently — are discovered *by the agent, mid-run*, and were then dropped on
the floor the moment the run ended.

`appelent-feature`'s `apply` step 6 fixed this for exactly one code path. This
generalizes it: **every skill ends by reflecting on itself** and offering to file
what it found back to the catalog. Skills improve as a side effect of being used.

## Reversal

`2026-07-14-issues-generalization-design.md` listed proactive in-subcommand
prompting as out of scope, on noise grounds. That concern was right, but the
answer is anti-noise rules rather than silence: a hard "nothing noteworthy → say
nothing" threshold, one batched issue per run, dedupe against open issues, and
never filing without asking. `apply` step 6 already crossed this line and has
proven the shape; this spec makes the reversal explicit rather than leaving the
two documents in contradiction.

## Mechanism

One canonical reference —
`skills/appelent-feature/references/self-improvement.md` — plus a short
`## Self-improvement` pointer section at the end of every `SKILL.md`. Shared by
pointer, not copied, mirroring how the `issue` procedure is already shared.

It lives under `appelent-feature` because reflection always targets the catalog
repo, which is that front door's fixed target, and because `apply` step 6 is the
prototype being generalized. A top-level `skills/_shared/` would have needed
adding to the `EXCLUDED` set in `scripts/validate-catalog.mjs` (and its prose
mirror in `appelent-feature`'s SKILL.md), since any other sibling directory is
read as a feature missing its `FEATURE.md`.

The reference defines: when it runs, the five things to notice (ambiguity,
docs that don't work as written, open decisions that cause project drift, silent
cases, undocumented necessary steps), what it is *not* (a work summary, app
bugs, your own misreads), the say-nothing threshold, and the filing procedure.

## Target repo: always the catalog

Reflection issues always go to `AppElent/appelent-packages`, regardless of front
door or current repo. This **overrides** "Issues: target repo and type labels",
which routes `/appelent:project issue` to the app's own repo and explicitly
forbids falling back to the catalog.

The two rules are not in conflict once scoped: that rule governs issues *about an
app*, this one governs issues *about a skill*. Skills live in the catalog, so
skill feedback filed into an app's backlog would sit where nobody maintaining
that skill will see it. Both documents state the override so neither reads as a
bug to a future maintainer.

Type labels are unchanged — inferred via the existing table, with
`documentation` and `enhancement` the usual outcomes.

## Anti-noise rules

This fires on every skill run, so restraint is the whole design:

- **Silence is the normal outcome.** No "no issues found" line.
- **One issue per run**, batched, each point naming its skill and section.
- **Dedupe first**: `gh issue list --repo AppElent/appelent-packages --state
  open --search "<terms>"`; on a match, offer a comment on the existing issue.
  Recurring friction accumulates evidence on one issue instead of refiling.
- **Ask before filing.** Never automatic.
- **No double-reflection.** When a feature skill is reached via
  `/appelent:feature apply <feature>`, `apply` step 6 owns the reflection for
  that run and covers both itself and the feature `SKILL.md` it followed. Each
  feature skill's pointer says so explicitly.

## Enforcement

`validateCatalog` gained a pass over *every* `skills/*` directory (not just the
non-`EXCLUDED` feature folders) asserting each `SKILL.md` references
`self-improvement.md`, plus a check that the reference doc exists. A plain
substring check: this lints against forgetting, it does not grade prose. A new
skill therefore cannot silently opt out.

## Versioning

No `FEATURE.md` version bumps for auth/baseline/cli/i18n/mcp. That version
tracks the shape a feature wires into an app; a reflection pointer changes
nothing that gets applied, so bumping it would falsely report every registered
project as behind and trigger pointless `--update` passes.

The **plugin** version is a different number and does need bumping — every
`skills/` change does, or Claude Code and Codex keep serving the cached old
prose. Don't read "no version bump" above as covering both; that conflation is
how 0.1.5 shipped four skill changes late. `validate:catalog` now enforces the
plugin bump (see the README).

## Error Handling

- **`gh` not authenticated / no network:** report the failure from `gh` plainly,
  same as the `issue` verb. The reflection is never worth blocking or retrying —
  the skill's actual work is already done and reported by this point.
- **Search returns an ambiguous near-match:** show it and let the user decide
  between commenting and filing fresh; don't guess.
- **User declines:** drop it. Don't re-propose the same points later in the
  session.

## Testing

No runtime — this is prose shaping agent behavior, plus a substring lint.

`pnpm validate:catalog` covers the mechanical half: a temp-repo test that skills
missing the pointer are reported (excluded ones included), a missing-reference-doc
test, and real-repo content assertions that the reference states the
always-catalog rule, the dedupe search, ask-before-filing, and the threshold; that
`appelent-project`'s section points at the catalog rather than the app repo; and
that all five feature skills carry the apply double-reflection guard.

The behavioral half is a manual walkthrough:

1. `/appelent:project upgrade-deps` in an app that hits real friction → proposes
   a **catalog** issue (not an app issue), and asks first.
2. A clean run of the same → says nothing about reflection at all.
3. `/appelent:feature apply auth` → exactly one reflection, `apply`'s, not a
   second from `auth`'s own pointer.
4. Trigger the same friction twice → the second run finds the open issue by
   search and offers a comment instead of a duplicate.

## Out of Scope

- **Auto-filing**, or any unattended GitHub write — unchanged, always ask.
- **A hook-based mechanism.** A `Stop` hook fires per session, not per skill run,
  and can't tell which skill ran — too blunt for this.
- **Reflecting on app code.** Bugs found in the app remain ordinary
  `/appelent:project issue` territory.
- **`sync-skills` fallback copies** resolving the pointer. It will dangle there,
  as `auth`'s and `cli`'s package-README pointers already do; those copies are
  explicitly a degraded mode.
