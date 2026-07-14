# Session-Aware Capture Design

Date: 2026-07-14

Amends: the `capture <topic>` subcommand in `skills/appelent-catalog/SKILL.md`
(introduced in `2026-07-13-appelent-features-design.md`).

## Purpose

Today, `capture <topic>` always starts from a blank interview: it asks the
user what/stack/architecture/configuration from scratch and writes a new
`skills/<topic>/FEATURE.md`. In practice, the common case is different: the
user has just finished building (or extending) something in an app session,
and wants that work folded back into the catalog without re-explaining it
from memory.

This design makes `capture` session-aware: when it's run in a session where
a feature was just built, it drafts the catalog entry from the conversation
itself, grounds that draft against the real repo, and only interviews the
user for genuine gaps. It also auto-detects whether the work is a brand-new
feature or an extension of an existing one, and closes the loop by
recording the result in the app's `appelent.json`.

## Flow

1. **Resolve target.** Check the catalog repo for `skills/<topic>/`.
   - Exists → **extend mode** (version bump on the existing feature).
   - Doesn't exist → **new mode** (fresh feature at version 1).
   - If the named topic doesn't exist but the session's work looks like it
     touched an existing feature's territory (e.g. topic `rate-limiting`
     but the session was extending `auth`), ask the user to confirm the
     target rather than guessing.
2. **Draft from session.** Summarize the current conversation's decisions —
   what was built, stack choices, architecture, configuration, files
   touched — as the primary source, instead of a blank interview.
3. **Ground against the repo.** Spot-check concrete claims in the draft
   (file paths, package names, config keys) against `git diff`/`git log`
   and actual file contents in the current app repo. Anything that doesn't
   check out is flagged back to the user instead of written down as fact.
   This matters most after a long or compacted session, where conversation
   memory of early decisions can be thin or wrong.
4. **Fill gaps.** Ask targeted questions only for what's still missing or
   uncertain after steps 2–3 — never a full interview when the session
   already answered most of it.
5. **Write catalog files**, in the catalog repo checkout
   (`D:\Dev\appelent-packages`):
   - New mode: create `skills/<topic>/FEATURE.md` at `version: 1` (What /
     Stack / Architecture / Configuration / Changelog) and a stub
     `SKILL.md`, per the existing contract.
   - Extend mode: increment the existing `FEATURE.md`'s `version`, append a
     Changelog line describing the addition, and update the Stack /
     Architecture / Configuration sections in place so the doc stays a
     coherent description of current state (not an append-only log).
6. **Validate & commit.** Run `pnpm validate:catalog` in the catalog repo,
   then commit the `FEATURE.md`/`SKILL.md` changes there.
7. **Record in the app.** Write/update the entry in the app's
   `appelent.json`:
   - New mode: add `"<topic>": { "version": 1, "options": {...} }`.
   - Extend mode: bump the existing entry's `"version"` to match.
   - If the app has no `appelent.json` yet, create it with the
     `{ "features": {} }` shape first, same as `apply` does.
   - This is a **separate commit in the app repo** (different repo from the
     catalog checkout). Offer the commit; never make it silently — same
     principle `status` already follows for mismatches.

## Detection: new vs. extend

Decided purely by folder existence in the catalog repo — no fuzzy name
matching. This keeps the outcome predictable: same topic name always means
the same target. The only judgment call is the confirm-with-user fallback
in step 1, used when the session's actual subject matter seems to diverge
from the literal topic name given.

## Fallback: no session context

If `capture` is run from the catalog repo itself, or in a session where
nothing was actually built (e.g. the user is proposing a feature idea
before building it), there is no session work to summarize. It falls back
to today's blank-interview behavior unchanged.

## Error Handling

- **Grounding finds a mismatch** (claimed file/package doesn't exist,
  diff doesn't support a claim): flag it to the user and ask, rather than
  writing an unverified claim into `FEATURE.md`.
- **Ambiguous target** (topic name doesn't match session content): confirm
  the target feature with the user before writing anything.
- **No `appelent.json` in the app:** create it (`{ "features": {} }`) rather
  than failing.
- **Catalog validation fails** (`pnpm validate:catalog`): fix and re-run
  before committing; same as the existing `apply`/`capture` contract.

## Testing

- New mode: run `capture` in a session that built something with no
  matching `skills/` folder; verify the drafted `FEATURE.md` reflects the
  session's actual decisions and that grounding catches at least one
  deliberately-wrong claim in a test run.
- Extend mode: run `capture` against an existing feature folder; verify
  the version bump, Changelog line, and in-place section updates (not a
  duplicate feature folder).
- appelent.json: verify both the new-entry and version-bump cases write the
  correct shape, and that a missing `appelent.json` is created.
- Fallback: run `capture` from the catalog repo with no app session;
  verify it behaves like today's blank interview.

## Out of Scope

- Automating the app-repo commit itself (still user-confirmed, per the
  "propose, never silently edit" principle).
- The separate "suggest improvements to the mechanism" command — a
  distinct, independent improvement to be designed separately.
