# @appelent/i18n

Shared internationalization engine for Appelent TanStack Start + Clerk apps:
locale resolution (cookie → `Accept-Language` → fallback), `fmt`/`plural`
interpolation, a typed React provider/hooks factory, SSR locale resolution for
TanStack Start, an optional Clerk `unsafeMetadata` sync, and a message-parity
test helper.

This README is the source of truth for consuming the package — it is
tool-agnostic (readable by Claude, Codex, and humans), unlike the Claude-only
`add-i18n` skill.

## Split of responsibilities

Don't blur this line:

- **This package**: locale resolution, `fmt`/`plural`, the `createI18n()`
  factory, `createGetSsrLocale()`, `createLanguageSync()`, and
  `assertMessageParity()`. Bug fixes to this logic land here, not
  copy-pasted into each app.
- **Per app (scaffolded, not shared)**: the app's own typed message
  dictionaries (`messages/<locale>/`), root-route wiring, and the
  `LanguageToggle` component — these vary by app content and header styling.
  The `add-i18n` skill scaffolds them; editing them afterward is expected.

## Install

Private GitHub Packages scope. The consuming app needs `.npmrc` mapping the
scope to the registry (token in user-level `~/.npmrc`, never committed — see
`PUBLISHING.md`):

```
@appelent:registry=https://npm.pkg.github.com
```

```bash
pnpm add @appelent/i18n
```

**Peer dependencies**: `react` ^19, `react-dom` ^19, `@tanstack/react-start`
^1.0 (needed for `./server`'s `createServerFn`). `@clerk/clerk-react` and
`vitest` are optional peers — only required if you use `./clerk-sync` or
`./test-utils` respectively.

## Consume

Build the app's own typed engine once, from its locale set and message
dictionary, then re-export what components need:

```ts
// src/lib/i18n/index.ts
import { createI18n } from "@appelent/i18n";
import { en, type Messages } from "./messages/en";
import { nl } from "./messages/nl";

export const SUPPORTED_LOCALES = ["en", "nl"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type { Messages };

export const {
	LocaleProvider,
	useI18n,
	useMessages,
	readClientLocale,
	hasExplicitLocaleChoice,
} = createI18n<Locale, Messages>({
	locales: SUPPORTED_LOCALES,
	fallback: "en",
	messages: { en, nl },
});

export { fmt, plural } from "@appelent/i18n";
```

Resolve the locale server-side (TanStack Start) and mount `LocaleProvider` as
the outermost wrapper in `__root.tsx` — locale in the route `loader` (client
vs. SSR branch, no client round-trip after hydration), `<html lang>` set from
it, `LocaleProvider` wrapping everything else. Full diff-style walkthrough,
the `LanguageToggle` component, and the message-dictionary scaffolding are in
the `add-i18n` skill — this README covers the package API; that skill covers
the per-app wiring recipe end to end (it's the reference for the exact
pattern, first proven on Arcade Club).

## Typed message dictionaries

Each locale's message tree `satisfies` the base (usually `en`) locale's
inferred type, so a missing or extra key is a **TypeScript compile error**,
not a runtime gap:

```ts
// messages/nl/common.ts
import type { common as enCommon } from "../en/common";

export const common = {
	actions: { save: "Opslaan", cancel: "Annuleren" },
} satisfies typeof enCommon;
```

Dynamic values use `{placeholder}` tokens rendered via `fmt(template, params)`;
counts use `plural(locale, count, { one, other })` (CLDR one/other via
`Intl.PluralRules`, `{count}` filled automatically).

## SSR locale resolution

```ts
// src/lib/i18n/server.ts
import { createGetSsrLocale } from "@appelent/i18n/server";
import { SUPPORTED_LOCALES, type Locale } from "./index";

export const getSsrLocale = createGetSsrLocale(SUPPORTED_LOCALES, "en" satisfies Locale);
```

Returns `{ locale: string }` — typed as `string`, not the app's `Locale`
union, because TanStack Start's server-fn serialization check requires a
concrete return type rather than a generic. `resolveLocale` only ever returns
one of `locales`, so cast at the call site:
`const { locale } = (await getSsrLocale()) as { locale: Locale };`.

## Clerk sync (optional)

Only if the app uses `@appelent/auth`/Clerk. Mirrors an explicit locale
choice into `user.unsafeMetadata.language` so it follows a signed-in user
across devices — the cookie stays the source of truth locally; this is a
best-effort remote mirror, not a second source of truth:

```tsx
// src/lib/i18n/LanguageSync.tsx
import { createLanguageSync } from "@appelent/i18n/clerk-sync";
import { hasExplicitLocaleChoice, SUPPORTED_LOCALES, useI18n } from "./index";

export const LanguageSync = createLanguageSync({
	useI18n,
	hasExplicitLocaleChoice,
	locales: SUPPORTED_LOCALES,
});
```

Mount `<LanguageSync />` inside `LocaleProvider` (and inside `ClerkProvider`).

## Message parity tests

```ts
// src/lib/i18n/__tests__/messages.test.ts
import { assertMessageParity } from "@appelent/i18n/test-utils";
import { en } from "../messages/en";
import { nl } from "../messages/nl";

assertMessageParity({ en, nl });
```

Recursively asserts every locale's message tree has identical key sets, no
empty strings, and identical `{placeholder}` tokens per message pair — this
is what makes every later incremental string-extraction provably correct
without hand-rolled leaf-collection logic per app.

## Public API

- **Engine**: `createI18n(config)` → `{ LocaleProvider, useI18n, useMessages, readClientLocale, hasExplicitLocaleChoice }`.
  Types: `I18nConfig<L, M>`, `I18nValue<L, M>`.
- **Core helpers**: `resolveLocale`, `isLocale`, `fmt`, `plural`.
- **`@appelent/i18n/server`**: `createGetSsrLocale(locales, fallback, cookieName?)`.
- **`@appelent/i18n/clerk-sync`**: `createLanguageSync(deps)` → `LanguageSync` component. Type `LanguageSyncDeps<L, M>`.
- **`@appelent/i18n/test-utils`**: `assertMessageParity(locales)`.

## When to migrate off this pattern

Once locale count grows past 2–3, once translations start coming from
external translators/a TMS rather than editing `.ts` files directly, or once
the app needs runtime locale switching without a full page's worth of typed
keys (CMS-driven content) — reach for a real i18n library
(`react-i18next`, `next-intl`, etc.) at that point. The typed-dictionary
shape maps 1:1 onto JSON message catalogs, so migrating later is mechanical,
not a redesign.

## Develop & publish

```bash
pnpm --filter @appelent/i18n build       # tsup → dist/
pnpm --filter @appelent/i18n test        # vitest
pnpm --filter @appelent/i18n typecheck
pnpm --filter @appelent/i18n lint         # biome
```

Publish per the repo's `PUBLISHING.md` (`build`, then
`pnpm --filter @appelent/i18n publish --no-git-checks`; needs `NODE_AUTH_TOKEN`).
