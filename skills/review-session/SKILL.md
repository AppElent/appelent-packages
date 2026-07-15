---
name: review-session
description: Start a live review session — I browse/test the app in the preview, you capture my feedback and file a self-contained GitHub issue. Use when I say "let's do a review session", "start reviewing", or similar.
---

# Review Session

## Your role this session

I'm going to start the app and browse it myself in the in-app preview browser. I'll test pages, click around, and talk out loud as I go. **Your job is to listen and take notes — not to act.**

The notes you produce will become one GitHub issue that Claude can execute
autonomously later. This is the key constraint: **for every item, you must
capture enough context that a fresh Claude session with no memory of this
review could find and fix it without asking me anything.** If you don't have
that context, get it now (see below).

Before starting, gather context to ground the session:

- Current branch (`git branch --show-current`)
- Dev/preview scripts (`package.json`)
- Project structure (`README.md`)

Rules for the session:

1. **Do not change code, run tests, or fix anything** while I'm reviewing — even if I describe a bug. Just capture it. We triage after.
2. After each thing I say, give a **brief acknowledgement only** (e.g. "Got it — logged: login button misaligned on mobile"). Don't propose fixes or expand.
3. **Resolve location while it's cheap.** When I describe an issue but don't say exactly where it lives in the code, quietly figure it out — read the relevant route/component file(s) to pin down the file path, component name, and the specific code involved. Do this silently between items; only surface a **single** short question if you genuinely can't locate it. The point is that the final file names real files, not vague descriptions.
4. Keep a running internal list. For each item capture:
   - **What** I observed (issue / feedback / idea, in concrete terms)
   - **Where** — exact route + file path(s) + component/function name (you look this up, don't make me give it)
   - **Type** — bug, UX, copy, design, feature idea, question
   - **Severity** — blocker / major / minor / nice-to-have
   - **Fix direction** — a concrete starting point for the change (what to modify and roughly how), enough that an executing agent isn't guessing intent
   - **Acceptance** — how to know it's done (the observable behaviour I'd expect after the fix)
5. If I give an opinion that could be interpreted multiple ways ("this feels off"), pin down what specifically and what I'd want instead — one short question, then move on.

## Ending the session

When I say I'm done ("wrap up", "summarize", etc.), create a single GitHub
issue in the current app repo.

Resolve the target repo with:

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

If the repo cannot be resolved, `gh` is not authenticated, or issues are
disabled, stop and report the `gh` failure plainly. Never fall back to the
catalog repo.

Use this issue title:

```text
Review session: <date/time>
```

Use this issue body:

```md
# Review Session — <date/time>

Branch: <branch>
Preview/run command: <command to start the app>

## Goal

Address all action items below. Each item is self-contained: route, file paths, fix direction, and acceptance criteria are specified. Work through them in severity order. After each fix, verify against its acceptance criteria. Run typecheck, lint, and tests before considering an item done. Do not weaken tests to pass. Commit each item separately once done and verified — one commit per action item, not one commit at the end.

## Summary

<1–2 sentence overview + counts by type/severity>

## Action Items

### Blockers

- [ ] **<short title>**
  - **What:** <concrete description>
  - **Where:** `<route>` -> `<file path>` (`<component/function>`)
  - **Type:** <type>
  - **Fix direction:** <what to change and roughly how>
  - **Acceptance:** <observable expected behaviour>

### Major

- [ ] ...

### Minor

- [ ] ...

### Nice-to-have / Ideas

- [ ] ...

## Open Questions

- <anything genuinely unresolved — keep this near-empty; resolve during the session, not here>
```

Order items by severity within each section. Use checkboxes.

Before creating the issue, do a self-check: **would a fresh Claude with only
this GitHub issue be able to complete every item without asking me a
question?** If any item fails that test, fill the gap (look up the file,
infer the acceptance criterion) before filing it.

Infer exactly one issue label:

- `bug` if any blocker or major action item is broken behavior, a console
  error, a network error, or an accessibility failure that blocks the flow.
- `enhancement` otherwise.

Ensure the chosen label exists using the shared Appelent issue convention:
`gh label list --repo <target repo> --search <label>`; only if absent, create
it with `gh label create <label> --repo <target repo> --color <color>
--description "<description>"` where `bug` uses `d73a4a` / "Something isn't
working" and `enhancement` uses `a2eeef` / "New feature or request".

Create the issue:

```bash
gh issue create --repo <target repo> --title "<title>" --body "<issue body>" --label <label>
```

After creating the issue, give me the GitHub issue URL and a one-line count
recap, then ask a single question: **"Want me to fix this issue now?"** Don't
propose fixes; just ask, then wait.

- If I say no (or "later"): stop here. The issue stays open for whenever I
  want to pick it up.
- If I say yes: use the created issue as the execution source. Work through
  the action items in severity order; after each fix, verify against that
  item's acceptance criteria and run typecheck, lint, and tests before
  considering it done. Do not weaken tests to pass. Commit each item
  separately once done and verified — one commit per action item, not one
  commit at the end. Offer to close the issue only after all items are fixed
  and verified.

## Self-improvement

Once the review issue exists and I've answered that question, follow the
reflection in `../appelent-feature/references/self-improvement.md` — notice
what was unclear or underspecified about *this skill's own instructions* and
offer to file it back to the catalog.

**These are two different issues in two different repos — don't merge them.**
The review issue above is my feedback about the app and goes to the **app's**
repo. This one is about the review procedure itself — an ambiguous step, a
question you had to guess the intent of, a judgment call the skill left open —
and goes to the **catalog** repo (`AppElent/appelent-packages`), because that's
where this skill lives. Never put skill friction in my review issue, and never
put my app feedback in the catalog.

Nothing noteworthy is the normal outcome — say nothing then.
