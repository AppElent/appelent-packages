# @appelent/auth

Shared Clerk↔Convex authentication glue for Appelent apps: prebuilt sign-in /
sign-up / forgot-password / profile UI (Base UI primitives, themeable), a
config provider for per-app branding, light/dark theme helpers, and a dev-only
test-login button that is structurally impossible to ship to production.

This README is the source of truth for consuming the package — it is
tool-agnostic (readable by Claude, Codex, and humans), unlike any Claude-only
skill.

## Install

Private GitHub Packages scope. The consuming app needs `.npmrc` mapping the
scope to the registry (token in user-level `~/.npmrc`, never committed — see
`PUBLISHING.md`):

```
@appelent:registry=https://npm.pkg.github.com
```

```bash
pnpm add @appelent/auth
```

**Peer dependencies** (the app provides these): `react` ^19, `react-dom` ^19,
`@clerk/clerk-react` ^5.61. The app owns the `<ClerkProvider>` and the
Clerk↔Convex JWT bridge; this package supplies the UI and helpers on top.

## Consume

Wrap the app once with `AuthConfigProvider` (per-app branding + social
providers) and inject the theme-init script to avoid a flash of the wrong
theme — `workouts` does this in `src/routes/__root.tsx`:

```tsx
import {
	AuthConfigProvider,
	DEFAULT_AUTH_CONFIG,
	THEME_INIT_SCRIPT,
} from "@appelent/auth";

// in <head>: <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

<AuthConfigProvider value={DEFAULT_AUTH_CONFIG}>
	<App />
</AuthConfigProvider>;
```

Then drop the forms into routes (each Clerk-backed, `ssr: false`):

```tsx
import { AuthCard, SignInForm } from "@appelent/auth";

<AuthCard title="Sign in" subtitle="Welcome back.">
	<SignInForm onSuccess={() => navigate({ to: "/dashboard" })} />
</AuthCard>;
```

Optional design tokens for the auth UI are a separate export:

```ts
import "@appelent/auth/tokens.css";
```

`workouts` is the reference implementation: `AuthCard`/`SignInForm`/`SignUpForm`/
`ForgotPasswordForm` in `src/routes/{sign-in,sign-up,forgot-password}.tsx`,
`HeaderUser` in the sidebar, `ProfilePanel` at `/account`.

## Dev test login

`TestLoginButton` (rendered by `SignInForm`) shows a "▶ Dev: log in as test
user" button **only** when `shouldShowTestLogin(env)` is true — i.e. the Clerk
key is a *test* key (`pk_test_…`, never `pk_live_…`) **and** both
`VITE_TEST_USER_EMAIL` / `VITE_TEST_USER_PASSWORD` are set. Both conditions must
hold, so the button can never appear in production. Use it to authenticate when
verifying auth-gated pages locally or on a non-prod preview.

## Public API

- **Providers / config**: `AuthConfigProvider`, `DEFAULT_AUTH_CONFIG`,
  `useAuthConfig`; type `AuthConfig`.
- **Forms & cards**: `AuthCard`, `SignInForm`, `SignUpForm`,
  `ForgotPasswordForm`, `ProfilePanel`, `AppearanceSettings`.
- **Primitives**: `AuthButton`, `AuthField`, `AuthError`; types
  `SlotClassNames`, `SocialProvider`; helper `clerkErrorMessage`.
- **Header / nav**: `HeaderUser`.
- **Theme**: `ThemeSync`, `applyThemeMode`, `getInitialMode`, `reconcileTheme`,
  `setThemeMode`, `THEME_INIT_SCRIPT`; type `ThemeMode`.
- **Dev login**: `TestLoginButton`, `shouldShowTestLogin`.
- **Styles**: `@appelent/auth/tokens.css`.

## Develop & publish

```bash
pnpm --filter @appelent/auth build       # tsup → dist/
pnpm --filter @appelent/auth test        # vitest
pnpm --filter @appelent/auth typecheck
pnpm --filter @appelent/auth lint         # biome
```

Publish per the repo's `PUBLISHING.md` (`build`, then
`pnpm --filter @appelent/auth publish --no-git-checks`; needs `NODE_AUTH_TOKEN`).
