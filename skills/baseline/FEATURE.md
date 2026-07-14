---
name: baseline
version: 4
description: The Appelent project baseline for TanStack Start + Convex + Clerk + Cloudflare Workers apps
---

# Baseline

## What

The shared project foundation every Appelent app starts from: package
management, formatting, testing, deploy config, CI, required scripts, an
app-local GitHub issue reporter, mobile-viewport hygiene, and PWA
installability. Applying it is idempotent — merge, don't clobber.

## Stack

- Framework: TanStack React Start + Router (file-based routing, SSR, Vite)
- Backend: Convex; Auth: Clerk (JWT template `convex`)
- Deploy: Cloudflare Workers (`wrangler.jsonc` + `@cloudflare/vite-plugin`)
- Tooling: pnpm (never npm/yarn), Biome (tab indent, double quotes, LF),
  Vitest + jsdom + @testing-library, Tailwind v4, @t3-oss/env-core
- Registry: private GitHub Packages scope `@appelent` via `.npmrc`
- Feedback: app-local TanStack Start API route + React modal that creates
  GitHub issues using a server-only fine-grained token
- PWA: `vite-plugin-pwa` with manual registration (no static `index.html`
  under TanStack Start SSR), precaching the static app shell only — never
  Convex/API traffic, so the service worker never fights Convex's real-time
  websocket sync

## Architecture

See `SKILL.md` — it is the executable form of this baseline (scripts,
Convex env vars, wrangler config, Windows hygiene, PR preview workflow,
pnpm migration, GitHub issue reporter scaffold, iOS input-focus-zoom
prevention, and PWA manifest/service-worker wiring). The baseline also
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

- 4 — baseline adds two default steps: mobile-viewport hygiene (CSS-only
  fix so iOS Safari doesn't zoom in on input focus, step 14) and PWA support
  (installable manifest + auto-updating service worker via `vite-plugin-pwa`,
  precaching the static shell only, step 15)
- 3 — baseline's numbered steps are individually addressable: `/appelent
  apply baseline --step <n>` (re)applies just one, `steps baseline` lists
  them, and `apply <feature> --all` applies to every project registered in
  `projects.json`, not just the current app
- 2 — baseline includes an app-local GitHub issue reporter scaffold
- 1 — initial capture (migrated from the `custom-bootstrap` global skill)
