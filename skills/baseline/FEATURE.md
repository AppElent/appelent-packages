---
name: baseline
version: 2
description: The Appelent project baseline for TanStack Start + Convex + Clerk + Cloudflare Workers apps
---

# Baseline

## What

The shared project foundation every Appelent app starts from: package
management, formatting, testing, deploy config, CI, required scripts, and
an app-local GitHub issue reporter. Applying it is idempotent — merge,
don't clobber.

## Stack

- Framework: TanStack React Start + Router (file-based routing, SSR, Vite)
- Backend: Convex; Auth: Clerk (JWT template `convex`)
- Deploy: Cloudflare Workers (`wrangler.jsonc` + `@cloudflare/vite-plugin`)
- Tooling: pnpm (never npm/yarn), Biome (tab indent, double quotes, LF),
  Vitest + jsdom + @testing-library, Tailwind v4, @t3-oss/env-core
- Registry: private GitHub Packages scope `@appelent` via `.npmrc`
- Feedback: app-local TanStack Start API route + React modal that creates
  GitHub issues using a server-only fine-grained token

## Architecture

See `SKILL.md` — it is the executable form of this baseline (scripts,
Convex env vars, wrangler config, Windows hygiene, PR preview workflow,
pnpm migration, and GitHub issue reporter scaffold). The baseline also
owns stamping the managed block in `CLAUDE.md`/`AGENTS.md` and creating
`appelent.json`.

## Configuration

- `.npmrc` mapping the `@appelent` scope to GitHub Packages
- GitHub Actions PR preview workflow + repo secrets
- Convex env vars and Clerk JWT template as detailed in SKILL.md
- `GITHUB_ISSUES_TOKEN` server-side runtime secret for issue creation
- GitHub repository target config, either `GITHUB_REPOSITORY_OWNER` and
  `GITHUB_REPOSITORY_NAME` or an equivalent app-local config source

## Changelog

- 2 — baseline includes an app-local GitHub issue reporter scaffold
- 1 — initial capture (migrated from the `custom-bootstrap` global skill)
