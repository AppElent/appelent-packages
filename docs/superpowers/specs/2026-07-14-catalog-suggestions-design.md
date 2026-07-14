# Catalog Suggestions Design

Date: 2026-07-14

Extends: `skills/appelent-catalog/SKILL.md` (the `/appelent` front door), same
mechanism described in `2026-07-13-appelent-features-design.md`.

## Purpose

Ideas for improving the catalog mechanism itself (or a specific feature,
e.g. "the baseline apply flow should also do X") come up mid-work — often
while applying a feature to an app — and get lost because there's no
low-friction way to jot them down without either interrupting the current
task to fully design them, or just forgetting them.

This adds a braindump: a near-zero-friction way to log an idea as a GitHub
issue in the catalog repo, and a way to come back later, pick one up, and
feed it straight into the existing `brainstorming` skill instead of
starting from a blank prompt.

This explicitly does **not** special-case `apply baseline` (or any other
subcommand) with a proactive "any ideas?" prompt — subcommands are already
reachable by natural language, so noting an idea mid-`apply` needs no new
wiring beyond the `suggest` subcommand existing.

## Capture: `suggest <idea>`

New subcommand in `skills/appelent-catalog/SKILL.md`, reachable by natural
language (e.g. "note an idea: X", "suggest that we...").

1. Take the user's one-line idea as the issue title. If the same message
   included more context, use it as the issue body; otherwise the body is
   empty.
2. Ensure the `catalog-suggestion` label exists on `AppElent/appelent-packages`
   (`gh label list --repo AppElent/appelent-packages` first; create it with
   `gh label create catalog-suggestion --repo AppElent/appelent-packages
   --description "Braindumped improvement idea for the appelent-packages
   catalog mechanism" --color ededed` only if missing).
3. File the issue: `gh issue create --repo AppElent/appelent-packages
   --title "<idea>" --body "<context or empty>" --label catalog-suggestion`.
4. Always targets `AppElent/appelent-packages` regardless of the current
   working repo — same cross-repo behavior as `capture` always writing into
   the catalog checkout.
5. No interview, no follow-up questions — optimized for capturing the
   thought and moving on.

## Resume: `suggestions`

New subcommand, reachable by natural language (e.g. "what improvement
ideas do I have?", "let's work on one of my suggestions").

1. List open candidates: `gh issue list --repo AppElent/appelent-packages
   --label catalog-suggestion --state open`. Show the user the number and
   title of each.
2. The user picks one (by issue number or by naming it).
3. Fetch that issue's full content: `gh issue view <n> --repo
   AppElent/appelent-packages`.
4. Hand the issue's title + body to the `brainstorming` skill as the
   starting context, in place of a blank user prompt — same brainstorming
   flow as any other request, just pre-seeded.
5. After that work concludes (design/plan/implementation as normal),
   offer to close the issue (`gh issue close <n> --repo
   AppElent/appelent-packages`). Never close it automatically — same
   "propose, don't silently act" principle `status` and `apply` already
   follow for app-side edits.

No new state file is introduced. GitHub issues are the backlog; open vs.
closed status is the pending-vs-done signal, so there's nothing to keep in
sync.

## Error Handling

- **`gh` not authenticated / no network:** report the failure from `gh`
  directly to the user; don't retry silently or fall back to writing a
  local file (that would create a second source of truth).
- **No open `catalog-suggestion` issues when `suggestions` is run:** say so
  plainly rather than erroring.
- **Ambiguous pick** (user names something that matches multiple or no
  listed issues): ask them to clarify by number.
- **Label doesn't exist yet:** create it as part of the first `suggest`
  call (step 2 above); never fail because of a missing label.

## Testing

There is no code here — like `capture`, this is prose in
`skills/appelent-catalog/SKILL.md` that shapes agent behavior, not a
runtime to unit test. Verification is a manual walkthrough:

- Run `suggest` with a short idea and no extra context; confirm a
  `catalog-suggestion`-labeled issue is created with that title and an
  empty body.
- Run `suggest` again with extra context in the same message; confirm the
  body captures it.
- Run `suggestions`; confirm both issues above are listed, pick one, and
  confirm the brainstorming skill starts from that issue's content instead
  of asking "what would you like to build?" from scratch.
- Confirm the label is only created once (second `suggest` call doesn't
  error or duplicate the label).

## Out of Scope

- Any change to `apply` (baseline or otherwise) to proactively prompt for
  ideas — explicitly rejected in favor of natural-language `suggest` at any
  time.
- Auto-closing issues, or any other unattended write to GitHub.
- A local-file backlog alternative — GitHub issues are the single store.
