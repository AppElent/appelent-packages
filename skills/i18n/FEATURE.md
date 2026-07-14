---
name: i18n
version: 1
description: Typed, dependency-light internationalization for TanStack Start apps via @appelent/i18n
package: "@appelent/i18n"
---

# i18n

## What

Internationalization with typed message dictionaries: the engine (locale
resolution, `fmt`/`plural`, React provider/hooks, SSR locale, optional
Clerk metadata sync, parity test helper) lives in `@appelent/i18n`; each
app owns its `messages/{locale}/` trees and UI chrome (LanguageToggle).

## Stack

- Package: `@appelent/i18n` (GitHub Packages)
- Options: `locales` — list per app (default example `["en", "nl"]`);
  `clerkSync: true | false` (only for apps using Clerk/@appelent/auth)
- Deliberately not a full i18n library; migrate to one only past 2-3
  locales or external translators (see SKILL.md notes)

## Architecture

- `src/lib/i18n/` per app: `index.ts` (createI18n), `server.ts`
  (SSR locale), optional `LanguageSync.tsx`, `messages/<locale>/`
- `satisfies`-chained dictionaries: key parity enforced by typecheck plus
  `assertMessageParity` in a single messages test
- Root route: locale in the loader, `<html lang>`, outermost
  `LocaleProvider`

## Configuration

- No env vars; locale persisted client-side (and optionally to Clerk
  metadata via `createLanguageSync`)

## Changelog

- 1 — initial capture (migrated from the `add-i18n` global skill)
