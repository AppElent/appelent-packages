---
name: guidance
description: Apply one or more cross-project guidance-doc areas (mobile-interaction, and later web-interaction, ci-cd, ...) into an app's docs/, synced from this catalog's canonical content.
---

# guidance

Read `FEATURE.md` first — it explains the split between this feature's
`content/` (generic, catalog-owned) and each app's own local addendum
(app-specific, owned by the app).

## Task

### 1. mobile-interaction

1. Copy `content/mobile-interaction.md`'s body into the target app's
   `docs/mobile-interaction.md`, between
   `<!-- appelent-managed:start -->` / `<!-- appelent-managed:end -->`
   markers. If the file doesn't exist yet, create it with just the
   managed block; the app's own local section is added by hand
   afterward, not by this step. If it already exists, replace only what's
   between the markers — never touch content above or below them.
2. Copy `content/mobile-interaction-research.md` verbatim to the target
   app's `docs/research/mobile-interaction-vocabulary.md`. **If the app
   already has its own research doc there predating this feature** (as
   gather does), do not overwrite it — ask the user how to reconcile
   instead of guessing, since that doc may hold irreplaceable project
   history. It is fine for an app to adopt only the decided-doc half of
   this step.
3. Record in the app's `appelent.json`: merge `"guidance": { "version":
   1, "steps": [1] }` — add `1` to the existing `steps` array if
   `guidance` is already recorded, don't overwrite other steps already
   there.

## Self-improvement

When this skill's work is done, follow the reflection in
`../appelent-feature/references/self-improvement.md` — notice what was
unclear or missing about this skill's steps while working through them,
and offer to file it back to the catalog if anything is worth filing.
