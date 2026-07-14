# Session-Aware Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the `capture <topic>` subcommand in `skills/appelent-catalog/SKILL.md` so it drafts the catalog entry from the current session's work (grounded against the real repo) instead of a blank interview, auto-detects new-feature vs. extend-existing, and records the result in the app's `appelent.json`.

**Architecture:** This is a single-file change to an agent-instruction skill (`SKILL.md` prose, not executable code) — there is no runtime to unit test. Verification is: (1) the catalog contract regression suite (`pnpm validate:catalog`), which checks `SKILL.md`/`FEATURE.md` shape, and (2) two scripted manual walkthroughs (new-mode and extend-mode) that exercise the actual `/appelent capture` flow against scratch repos and check the resulting files.

**Tech Stack:** Markdown (Agent Skills format), Node.js test runner (`node --test`) for the existing contract check, pnpm.

---

### Task 1: Rewrite the `capture <topic>` subcommand

**Files:**
- Modify: `skills/appelent-catalog/SKILL.md:3` (frontmatter description)
- Modify: `skills/appelent-catalog/SKILL.md:62-72` (the `## capture <topic>` section)

- [ ] **Step 1: Update the frontmatter description to cover extending existing features**

In `skills/appelent-catalog/SKILL.md`, line 3 currently reads:

```yaml
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature/design decision, or check an app's feature status/freshness.
```

Change `capture a new feature/design decision` to `capture a new feature or fold work into an existing one`, giving:

```yaml
description: Front door for the Appelent feature catalog (the /appelent command routes here). Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature or fold work into an existing one, or check an app's feature status/freshness.
```

- [ ] **Step 2: Replace the `## capture <topic>` section**

Replace the existing section (lines 62-72):

```markdown
## capture <topic>

Interview the user about the design decision (what, stack, architecture,
configuration), then in the catalog repo checkout
(`D:\Dev\appelent-packages`) create `skills/<topic>/FEATURE.md` at
`version: 1` following the contract (frontmatter name/version/description
+ sections What/Stack/Architecture/Configuration/Changelog) and a stub
`skills/<topic>/SKILL.md` whose body says to read FEATURE.md before
building `<topic>` functionality. Run `pnpm validate:catalog` there, then
commit both files.
```

with:

```markdown
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
```

- [ ] **Step 3: Run the catalog contract check**

Run: `pnpm validate:catalog`
Expected: `catalog ok` (the `appelent-catalog` folder is excluded from contract
checks — see `scripts/validate-catalog.mjs:21` — so this SKILL.md-only
change cannot fail it; this step is a regression guard, not new coverage).

- [ ] **Step 4: Commit**

```bash
git add skills/appelent-catalog/SKILL.md
git commit -m "feat(catalog): make capture session-aware and extend-capable"
```

---

### Task 2: Manual walkthrough — new-mode capture

There is no automated way to exercise an LLM-driven interview/summarization
flow in a unit test. This task is a scripted manual QA pass: a human (or an
agent following these exact steps) sets up a scratch scenario and confirms
the new `capture` instructions produce the right files.

**Files:**
- None (creates and discards a scratch directory tree)

- [ ] **Step 1: Set up a scratch app repo with a fake "just-built" feature**

```bash
rm -rf /tmp/capture-test-app
mkdir -p /tmp/capture-test-app/src/rate-limit
cd /tmp/capture-test-app
git init -q
cat > src/rate-limit/index.ts <<'EOF'
// scratch fixture: pretend token-bucket rate limiter
export function rateLimit() {}
EOF
git add -A
git commit -q -m "add token-bucket rate limiter"
```

- [ ] **Step 2: In a Claude Code session rooted at `/tmp/capture-test-app`, describe the work then invoke capture**

Send two messages in sequence:
1. `"I just added a token-bucket rate limiter in src/rate-limit/index.ts, using an in-memory bucket keyed by user id, configured via RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS env vars."`
2. `"/appelent capture rate-limit"`

- [ ] **Step 3: Verify the outcome**

Check, in the catalog repo checkout (`D:\Dev\appelent-packages`):
- `skills/rate-limit/FEATURE.md` was created at `version: 1`, and its
  Configuration section mentions `RATE_LIMIT_MAX` and
  `RATE_LIMIT_WINDOW_MS` (i.e. it drew from the session, not a blind
  interview that couldn't have known those names).
- `skills/rate-limit/SKILL.md` stub exists.
- `pnpm validate:catalog` passes for the new folder.
- The catalog repo has a commit adding both files.

In `/tmp/capture-test-app`:
- `appelent.json` exists (created fresh, since none existed) with
  `{ "features": { "rate-limit": { "version": 1 } } }`.
- The agent offered (did not silently make) a commit for this file.

- [ ] **Step 4: Tear down**

```bash
rm -rf /tmp/capture-test-app
```

If any check in Step 3 fails, fix the wording in
`skills/appelent-catalog/SKILL.md` (Task 1, Step 2) and repeat this task.

---

### Task 3: Manual walkthrough — extend-mode capture

Same approach as Task 2, but against an existing feature folder, to verify
the version-bump path instead of the new-feature path.

**Files:**
- None (creates and discards a scratch directory tree)

- [ ] **Step 1: Set up a scratch app repo extending an existing feature**

```bash
rm -rf /tmp/capture-test-app2
mkdir -p /tmp/capture-test-app2/src/auth
cd /tmp/capture-test-app2
git init -q
cat > src/auth/mfa.ts <<'EOF'
// scratch fixture: pretend TOTP-based MFA step added to auth
export function verifyTotp() {}
EOF
git add -A
git commit -q -m "add TOTP MFA step to auth"
```

- [ ] **Step 2: In a Claude Code session rooted at `/tmp/capture-test-app2`, describe the work then invoke capture**

Send two messages in sequence:
1. `"I just added TOTP-based MFA to the existing auth flow, in src/auth/mfa.ts, using the otpauth npm package, with a new MFA_ISSUER_NAME env var."`
2. `"/appelent capture auth"`

- [ ] **Step 3: Verify the outcome**

Check, in the catalog repo checkout (`D:\Dev\appelent-packages`):
- `skills/auth/FEATURE.md`'s `version` frontmatter was incremented by
  exactly 1 from whatever it was before this task started (record the
  before-value first: `git show HEAD:skills/auth/FEATURE.md | head -5`).
- A new Changelog line was appended describing the TOTP/MFA addition.
- The Stack and/or Configuration sections were updated in place to mention
  `otpauth` and `MFA_ISSUER_NAME` — not just appended as a changelog-only
  note.
- No new `skills/<something>/` folder was created (this is extend mode,
  not new mode).
- `pnpm validate:catalog` still passes.
- The catalog repo has a commit for the version bump.

In `/tmp/capture-test-app2`:
- If `appelent.json` did not exist, it was created with an `auth` entry at
  the new version. If it existed with an older `auth` version, that
  version was bumped to match (do not assert file creation unconditionally
  — check whichever case applies to your scratch setup).

- [ ] **Step 4: Tear down**

```bash
rm -rf /tmp/capture-test-app2
```

If any check in Step 3 fails, fix the wording in
`skills/appelent-catalog/SKILL.md` (Task 1, Step 2) and repeat this task
and Task 2 (a wording fix can affect both modes).

---

## Self-Review Notes

- **Spec coverage:** Resolve-target/detection (spec "Detection: new vs.
  extend") → Task 1 Step 2, item 1. Draft-from-session and fallback (spec
  "Flow" steps 2, "Fallback") → Task 1 Step 2, item 2. Grounding (spec
  "Grounding") → Task 1 Step 2, item 3. Gap-filling interview → item 4.
  Write catalog files new/extend (spec "Flow" step 5, "Extend mode
  specifics") → item 5. Validate & commit → item 6. Record in
  `appelent.json` including separate-commit and missing-file handling
  (spec "Recording back to the app") → item 7. Both walkthroughs (Tasks 2
  and 3) exercise every one of these in sequence end to end.
- **Placeholder scan:** No TBD/TODO; every step shows exact file content,
  exact commands, and exact expected output rather than describing intent.
- **Type consistency:** N/A — no code types involved; this plan only edits
  Markdown instruction text. The `appelent.json` shape used in Task 2/3
  Step 3 matches the shape already established in
  `docs/superpowers/specs/2026-07-13-appelent-features-design.md`.
