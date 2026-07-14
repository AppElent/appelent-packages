# Catalog Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two subcommands to `skills/appelent-catalog/SKILL.md` — `suggest <idea>` (zero-friction capture of an improvement idea as a GitHub issue) and `suggestions` (list open ideas and feed one into the `brainstorming` skill to resume it) — per `docs/superpowers/specs/2026-07-14-catalog-suggestions-design.md`.

**Architecture:** Single-file change to an agent-instruction skill (`SKILL.md` prose), same shape as the `capture` upgrade. No runtime code, so no unit tests. Verification is (1) the catalog contract regression suite (`pnpm validate:catalog`), (2) `gh --help` syntax checks for every command referenced in the new prose (read-only, doesn't touch GitHub), and (3) a dry-run reasoning walkthrough of both subcommands — no real GitHub issues are created during verification (confirmed with the user).

**Tech Stack:** Markdown (Agent Skills format), GitHub CLI (`gh`).

---

### Task 1: Add `suggest <idea>` and `suggestions` subcommands

**Files:**
- Modify: `skills/appelent-catalog/SKILL.md:3` (frontmatter description)
- Modify: `skills/appelent-catalog/SKILL.md` (insert two new sections between the existing `## capture <topic>` section and `## status [--all]`)

- [ ] **Step 1: Update the frontmatter description**

In `skills/appelent-catalog/SKILL.md`, line 3 currently reads:

```yaml
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature or fold work into an existing one, or check an app's feature status/freshness.
```

Change it to also cover the braindump subcommands:

```yaml
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature or fold work into an existing one, note an improvement idea for later (suggest) or pick one back up (suggestions), or check an app's feature status/freshness.
```

- [ ] **Step 2: Insert the `## suggest <idea>` section**

Insert this new section immediately after the `## capture <topic>` section (i.e. right before `## status [--all]`) in `skills/appelent-catalog/SKILL.md`:

```markdown
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
```

- [ ] **Step 3: Insert the `## suggestions` section**

Insert this new section immediately after the `## suggest <idea>` section (still before `## status [--all]`):

```markdown
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
```

- [ ] **Step 4: Run the catalog contract check**

Run: `pnpm validate:catalog`
Expected: `catalog ok` (the `appelent-catalog` folder is excluded from
contract checks — see `scripts/validate-catalog.mjs:21` — so this
SKILL.md-only change cannot fail it; this is a regression guard, not new
coverage).

- [ ] **Step 5: Commit**

```bash
git add skills/appelent-catalog/SKILL.md
git commit -m "feat(catalog): add suggest/suggestions braindump subcommands"
```

---

### Task 2: Verify `gh` command syntax (read-only)

Every `gh` invocation referenced in Task 1's new prose must be
syntactically valid, since a typo in a flag name would only surface the
first time a user actually runs `suggest`. This task checks each command's
flags against `gh --help` output — read-only, no GitHub state is touched.

**Files:**
- None (help-text inspection only)

- [ ] **Step 1: Verify `gh label list` and `gh label create` flags**

Run: `gh label list --help`
Confirm the output lists `-S, --search string` and the inherited
`-R, --repo [HOST/]OWNER/REPO` flag — both used in Step 2 of `suggest`.

Run: `gh label create --help`
Confirm the output shows `gh label create <name> [flags]` (name is
positional, not a flag) plus `-d, --description string`, `-c, --color
string`, and the inherited `-R, --repo` flag — matching the exact
invocation written into `suggest` Step 2.

- [ ] **Step 2: Verify `gh issue create` flags**

Run: `gh issue create --help`
Confirm `-t, --title string`, `-b, --body string`, and `-l, --label name`
are present, and that `--repo`/`-R` is available (inherited) — matching
`suggest` Step 3.

- [ ] **Step 3: Verify `gh issue list`, `gh issue view`, and `gh issue close` flags**

Run: `gh issue list --help`
Confirm `-l, --label strings` and `-s, --state string` are present —
matching `suggestions` Step 1.

Run: `gh issue view --help`
Confirm the usage line is `gh issue view {<number> | <url>} [flags]` and
`-R, --repo` is inherited — matching `suggestions` Step 3.

Run: `gh issue close --help`
Confirm the usage line is `gh issue close {<number> | <url>} [flags]` and
`-R, --repo` is inherited — matching `suggestions` Step 5.

- [ ] **Step 4: Fix any mismatches**

If any flag name in the new `SKILL.md` prose doesn't match what `--help`
shows, correct it in `skills/appelent-catalog/SKILL.md` now and re-run
`pnpm validate:catalog` (Task 1, Step 4), then amend with a follow-up
commit (do not force-amend the Task 1 commit).

---

### Task 3: Dry-run walkthrough — both subcommands

No real GitHub issues are created during this task (confirmed with the
user) — this is reasoning through the new instructions against a
hypothetical scenario, the same way Task 2/3 of the `capture` plan
(`docs/superpowers/plans/2026-07-14-session-aware-capture.md`) dry-ran
`capture` instead of writing real files.

**Files:**
- None (no gh mutation, no files written)

- [ ] **Step 1: Walk through `suggest`**

Given the input "note an idea: baseline should auto-detect the package
manager instead of assuming pnpm", trace through `suggest`'s 5 steps and
record:
- The issue title that would be used (the idea text verbatim).
- The issue body (empty, since no extra context was given in this
  example).
- The exact `gh label list` and conditional `gh label create` commands
  that would run first.
- The exact `gh issue create` command that would run, with `--repo
  AppElent/appelent-packages`, the title, an empty `--body`, and
  `--label catalog-suggestion`.

- [ ] **Step 2: Walk through `suggestions`**

Continuing from Step 1's hypothetical issue (assume it was filed as issue
number 42), trace through `suggestions`'s 5 steps and record:
- The `gh issue list` command and what it would show (issue #42 among any
  other open `catalog-suggestion`-labeled issues).
- What happens if the user's pick is ambiguous (per Step 2 of
  `suggestions`) vs. unambiguous.
- The `gh issue view 42 --repo AppElent/appelent-packages` command.
- Confirm the issue's title/body would be handed to the `brainstorming`
  skill as starting context — i.e. brainstorming would open with "here's
  an idea to explore: baseline should auto-detect the package manager..."
  instead of asking "what would you like to build?".
- Confirm the close offer (`gh issue close 42 --repo
  AppElent/appelent-packages`) only happens after that brainstorming work
  concludes, and is offered, not automatic.

- [ ] **Step 3: Confirm no gaps**

Check this reasoning against every point in
`docs/superpowers/specs/2026-07-14-catalog-suggestions-design.md`'s
"Capture" and "Resume" sections. If anything in the new `SKILL.md` prose
is ambiguous or would produce a wrong result, fix it (Task 1, Steps 2-3)
and repeat Task 2 and this task.

---

## Self-Review Notes

- **Spec coverage:** Capture section (title/body/label-ensure/issue-create/
  cross-repo/no-interview) → Task 1 Step 2. Resume section (list/pick/
  view/hand-to-brainstorming/offer-close) → Task 1 Step 3. Error handling
  (ambiguous pick → ask by number; label created on first use) → covered
  in both new sections' prose. Testing section's manual-walkthrough intent
  → Task 3. The spec's "Out of Scope" (no `apply` prompt, no auto-close,
  no local-file backlog) required no task — confirmed nothing in this plan
  adds any of those.
- **Placeholder scan:** No TBD/TODO; every step shows the exact command or
  exact markdown to insert, not a description of intent.
- **Type consistency:** N/A — no code types; this plan only edits Markdown
  instruction text. The `--repo AppElent/appelent-packages` and
  `catalog-suggestion` label name are used identically across Task 1's two
  new sections and Task 3's walkthrough.
