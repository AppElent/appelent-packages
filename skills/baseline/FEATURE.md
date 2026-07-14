---
name: baseline
version: 1
description: The Appelent project baseline for TanStack Start + Convex + Clerk + Cloudflare Workers apps
---

# Baseline

## What

The shared project foundation every Appelent app starts from: package
management, formatting, testing, deploy config, CI, and required scripts.
Applying it is idempotent — merge, don't clobber.

## Stack

- Framework: TanStack React Start + Router (file-based routing, SSR, Vite)
- Backend: Convex; Auth: Clerk (JWT template `convex`)
- Deploy: Cloudflare Workers (`wrangler.jsonc` + `@cloudflare/vite-plugin`)
- Tooling: pnpm (never npm/yarn), Biome (tab indent, double quotes, LF),
  Vitest + jsdom + @testing-library, Tailwind v4, @t3-oss/env-core
- Registry: private GitHub Packages scope `@appelent` via `.npmrc`

## Architecture

See `SKILL.md` — it is the executable form of this baseline (scripts,
Convex env vars, wrangler config, Windows hygiene, PR preview workflow,
pnpm migration). The baseline also owns stamping the managed block in
`CLAUDE.md`/`AGENTS.md` and creating `appelent.json`.

## Configuration

- `.npmrc` mapping the `@appelent` scope to GitHub Packages
- GitHub Actions PR preview workflow + repo secrets
- Convex env vars and Clerk JWT template as detailed in SKILL.md

## Changelog

- 1 — initial capture (migrated from the `custom-bootstrap` global skill)
