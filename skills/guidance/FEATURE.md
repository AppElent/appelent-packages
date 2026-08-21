---
name: guidance
version: 1
description: Cross-project AI-session guidance docs (decided rules + research trail) for areas like mobile interaction, synced from one canonical source into each app's docs/
---

# Guidance

## What

Short, prescriptive "decided" docs that tell a future AI session what to do
in a given area — modeled on gather's `docs/mobile-interaction.md` — plus a
companion research doc recording how each rule was arrived at. Each area
(`mobile-interaction`, and later `web-interaction`, `ci-cd`, ...) is
authored once here, generic to every AppElent app on the shared stack, and
applied into an app's `docs/` the same way any other feature is applied.

## Stack

- No package — this feature ships documentation content, not code.
- Options: `areas` — which of this feature's numbered steps (see
  `SKILL.md`) an app has adopted, e.g. `["mobile-interaction"]`. An app
  adopts only the areas relevant to it (a web-only app skips
  `mobile-interaction`).
- Areas available today: `mobile-interaction` (step 1).

## Architecture

See `SKILL.md` — one numbered step per area. Each step copies two files
from this feature's `content/` folder into the target app:
`content/<area>.md` into `docs/<area>.md`, wrapped in
`<!-- appelent-managed:start/end -->` markers so the app can append its
own local, app-specific section below the block without losing it on the
next sync; and `content/<area>-research.md` into
`docs/research/<area>-vocabulary.md`, copied verbatim (no local edits
expected there — an app's own research stays in its own doc; see
`SKILL.md` for what happens when an app already has one predating this
feature).

## Configuration

None — no env vars, no package installs. Applying this feature only writes
files under the target app's `docs/`.

## Changelog

- 1 — initial capture: step 1, `mobile-interaction`, migrated from
  gather's `docs/mobile-interaction.md` (generic rules only — gather's own
  module references, ADR links, and file paths stayed local to that app;
  gather's existing research doc predated this feature and was kept
  as-is rather than replaced by this feature's generic research note).
