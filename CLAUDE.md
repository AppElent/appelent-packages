# appelent-packages

The Appelent feature catalog: shared app design decisions, packaged as
Claude Code skills (`skills/<feature>/`) backed by reusable `@appelent/*`
npm packages (`packages/<feature>/`) where a feature ships runtime code.
Consuming apps apply features via `/appelent:feature apply <feature>` and
record what's installed in their own `appelent.json`.

**This plugin has no other instruction/behavior-shaping surface.** There is
no per-feature `CLAUDE.md`, no hidden config — `skills/<feature>/SKILL.md`
is the only place that shapes how Claude behaves when applying a feature.
If you're about to write a doc you expect an agent to read while doing
catalog work, it belongs in a `SKILL.md` (or a `references/` file a
`SKILL.md` links to, see `skills/mcp/references/`), not a new top-level doc.

See `skills/CLAUDE.md` for the `SKILL.md`/`FEATURE.md` authoring
conventions before adding or editing a feature.

## Structure

- `skills/<feature>/` — the catalog itself: `FEATURE.md` (what/stack/
  architecture/configuration/changelog) + `SKILL.md` (the apply procedure).
  `skills/appelent-feature` and `skills/appelent-project` are the two front
  doors (catalog-side vs. app-side operations); `review-app`,
  `review-session`, `upgrade-deps` are plugin-provided workflow skills, not
  catalog features — see `scripts/validate-catalog.mjs`'s exclusion list.
- `packages/<feature>/` — the `@appelent/*` npm packages a subset of
  features ship (`auth`, `cli`, `i18n` today).
- `scripts/validate-catalog.mjs` + `scripts/validate-plugin-manifests.mjs` —
  the schema contract, run via `pnpm validate:catalog` (also runs
  `tests/catalog.test.mjs`/`tests/plugin-manifests.test.mjs`). Run this
  after any `FEATURE.md`/`SKILL.md` edit.
- `projects.json` — absolute paths to registered downstream apps, used by
  `apply <feature> --all` and `status --all`.
- `.worktreeinclude` — patterns the Claude Code desktop app copies into a
  freshly created git worktree (gitignored env files, local settings).

## Commands

- `pnpm validate:catalog` — schema + tests, run before every catalog commit.
- `pnpm lint` — Biome (tab indent, double quotes, LF). Note: this repo has
  no build/typecheck step of its own; it's markdown + a handful of Node
  scripts, not an app.
