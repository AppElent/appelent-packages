# Self-improvement reflection

Every skill in this plugin ends by reflecting on **itself** — what was unclear,
wrong, or underspecified about the skill you just followed — and offering to file
that back to the catalog. Skills improve from their own use instead of only when
someone remembers to complain.

This is the canonical procedure. Each `SKILL.md` points here rather than
restating it.

## When

At the end of a skill run, after the work is done and reported. This is never a
gate on finishing the actual work, and never a reason to interrupt it mid-flight.

If a skill was reached through `/appelent:feature apply <feature>`, that run's
own reflection (`apply` step 6) covers both `apply` and the feature `SKILL.md` it
followed. Don't reflect twice.

## What to notice

Keep a running note **while you work**, not afterwards — friction is invisible in
hindsight once you've solved it, and a long or compacted session won't remember
it at all. Watch for:

1. An instruction ambiguous enough that you had to guess or interpret it.
2. A documented command, path, package name, or code example that didn't work as
   written.
3. A decision the skill left open that another app could reasonably resolve
   differently — the case that quietly causes drift between projects.
4. A case you hit that the skill is silent on.
5. Something you did that the skill should have told you to do.

## What this is not

- **Not a summary of what you did.** The skill's own reporting already covers
  that.
- **Not about the app's code.** Bugs and ideas about the app you were working in
  are ordinary `/appelent:project issue` territory, filed against the app's own
  repo. This is only about the skill and its docs.
- **Not a report on your own mistakes.** If you misread a clear instruction,
  that's not a doc gap. Leave it out.

## Threshold

**Nothing noteworthy is the normal outcome.** Most runs of a well-written skill
produce no friction worth filing. When that's the case, say nothing at all — no
"no issues found" line, no padding. A reflection that fires every run stops being
read.

## Filing

Only when step "What to notice" produced at least one real entry:

1. **Check for an existing issue first.**
   `gh issue list --repo AppElent/appelent-packages --state open --search "<terms>"`
   If an open issue already covers the same friction, say so and offer to add a
   comment to it instead of filing a duplicate. Recurring friction should
   accumulate evidence on one issue, not spawn a new one every run.
2. **Summarize the entries to the user**, briefly.
3. **Propose one issue for the whole run** — title is a one-line summary, body
   lists the individual points, each naming the skill and the section it's about
   (e.g. "`upgrade-deps` step 5: silent on whether a failing test predates the
   upgrade"). One issue per run, not one per point.
4. **Ask before filing. Never file automatically** — same "propose, don't
   silently act" rule the rest of the plugin follows.
5. File it with the `issue` procedure in `../../appelent-project/SKILL.md` —
   its type-label inference and ensure-exists steps apply unchanged
   (`documentation` and `enhancement` are the usual outcomes here).

## Target repo: always the catalog

Reflection issues **always** target `AppElent/appelent-packages`, regardless of
which front door invoked the skill or which repo is currently open.

This is a deliberate override of the "Issues: target repo and type labels" rule
in `../../appelent-project/SKILL.md`, which routes `/appelent:project issue` to
the app's own repo. That rule is right for issues *about an app*. It is wrong
here: the skills live in the catalog, so feedback about a skill filed into an
app's backlog would sit where nobody maintaining that skill will ever see it.
