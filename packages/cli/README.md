# @appelent/cli

Reusable command-line scaffolding for Appelent apps. Ships the generic `auth`
and `config` commands (browser/token login, credential storage, JSON/table
output, a hand-rolled arg parser) and an extension seam so each app can layer
its own domain commands on top without forking the package.

This README is the source of truth for how to consume the package — it is
tool-agnostic (readable by Claude, Codex, and humans), unlike the Claude-only
`add-cli` skill.

## Install

Private GitHub Packages scope. The consuming app needs `.npmrc` mapping the
scope to the registry (token in user-level `~/.npmrc`, never committed — see
`PUBLISHING.md`):

```
@appelent:registry=https://npm.pkg.github.com
```

```bash
pnpm add @appelent/cli
```

## Consume

Create a thin bin wrapper in the app (e.g. `cli/index.ts`) that names the app
and wires stdio; everything else comes from the package:

```ts
#!/usr/bin/env node
import { createCli } from "@appelent/cli";

const { runCli } = createCli({ appName: "workouts" });

const result = await runCli(process.argv.slice(2), {
	writeOut: (value) => console.log(value),
	writeErr: (value) => console.error(value),
	env: process.env,
});

process.exitCode = result.exitCode;
```

Wire it as a script (apps in this stack use `tsx`, not a published bin):

```jsonc
{ "scripts": { "workouts": "tsx cli/index.ts" } }
```

`workouts` (the reference implementation) does exactly this.

Add a wrapper smoke script and CI workflow in the consuming app so the local
wrapper stays healthy:

```jsonc
{
	"scripts": {
		"cli:smoke": "tsx cli/index.ts --help && tsx cli/index.ts config get --json && tsx cli/index.ts auth status"
	}
}
```

The workflow should install with the normal GitHub Packages auth step, set
`<APPNAME>_CONFIG_DIR` to a temporary directory, and run `pnpm cli:smoke`.

### What `appName` controls

Everything app-specific is derived from `appName` — nothing is hardcoded:

- **Config directory**: `%APPDATA%\<appName>` (Windows) or
  `$XDG_CONFIG_HOME/<appName>` ≈ `~/.config/<appName>` (POSIX), holding
  `config.json`.
- **Config-dir override env var**: `<APPNAME>_CONFIG_DIR` (upper-cased), e.g.
  `WORKOUTS_CONFIG_DIR` — handy for tests and CI.
- **Help text and error messages**: all reference `<appName>` as the command
  name.

`defaultApiUrl` (optional, default `http://localhost:3000`) seeds `apiUrl` when
no config file exists yet.

## Built-in commands

```
<appName> auth login                   # browser login through the app backend
<appName> auth login --token <token>   # store a token credential
<appName> auth status [--json]         # signed-in / expired / not signed in
<appName> auth logout                  # clear the stored credential
<appName> config get [--json]          # print config (credential redacted)
<appName> config set api-url <value>
<appName> config set convex-url <value>
```

Browser login starts a loopback HTTP callback server, opens the app backend,
waits for the backend to redirect back with a token, and stores the same
credential shape as `--token` login. The default backend URL is built from
`apiUrl` plus `/api/cli/auth/login`; override `apiUrl` with
`config set api-url <value>`.

Default browser-login contract:

1. CLI opens:
   `<apiUrl>/api/cli/auth/login?redirect_uri=<local-callback-url>&state=<state>`
2. App backend authenticates the user in the browser.
3. App backend redirects to `redirect_uri` with `token=<jwt-or-token>` and the
   same `state`.
4. CLI validates `state`, saves `token`, and exits successfully.

If authentication fails, redirect back with `error=<code>` and optional
`error_description=<message>`. The CLI reports that as a login failure. The app
backend route, browser UI, session exchange, and token issuance are
project-specific and stay in the consuming app.

Apps can customize the generic browser-login paths when creating the CLI:

```ts
const { runCli } = createCli({
	appName: "workouts",
	auth: {
		loginPath: "/api/cli/auth/login",
		callbackPath: "/callback",
		timeoutMs: 120_000,
	},
});
```

## Add app-specific commands

Domain commands (e.g. `exercise list`, `workout list`) are **not** in this
package — they belong to the app and call the app's own API/Convex functions.
Register them via `commands`; they layer on top of the built-in `auth`/`config`
dispatch, and their `usage` lines are appended to the generated help:

```ts
import { createCli, type CliCommand } from "@appelent/cli";

const exercise: CliCommand = {
	name: "exercise",
	usage: ["workouts exercise list"],
	handle: async (positionals, flags, runtime) => {
		// runtime: { appName, defaultApiUrl, auth, env, writeOut, writeErr }
		// use loadConfig(runtime) / requireCredential(runtime) as needed
		runtime.writeOut("...\n");
		return 0; // exit code
	},
};

const { runCli } = createCli({ appName: "workouts", commands: [exercise] });
```

Dispatch order: built-in `auth` → built-in `config` → registered `commands` →
`Unknown command`. Keep the package generic — add domain commands in the app,
don't fork.

## Publishing model

Most apps do **not** need to publish themselves to use a CLI. The default
Appelent pattern is repo-local: `pnpm <app>` runs the app's TypeScript wrapper
through `tsx`.

Publish only this shared `@appelent/cli` package when generic CLI behavior
changes (for example browser login, config storage, output helpers, or shared
auth helpers), then bump consuming apps to the newly published version. Do not
publish an app package just to get `pnpm <app>` working. If an app intentionally
needs an npm-installable app-specific binary later, design that separately: it
needs a scoped package name, a real compiled JS `bin`, and a focused publish
workflow.

## Public API

- `createCli(options)` → `{ runCli(args, ioRuntime) }` — the factory most apps use.
- `runCli(args, ioRuntime, options)` — lower-level entry the factory wraps.
- Types: `RunCliOptions`, `CliCommand`, `CliRuntime`, `IoRuntime`, `CliResult`,
  `BrowserLoginOptions`.
- Auth helpers: `saveToken`, `requireCredential`, `getCredentialStatus`,
  `logout`, `decodeJwtExpiry`, `startBrowserLogin`.
- Config helpers: `loadConfig`, `saveConfig`, `clearCredential`, `configDir`,
  `configPath`; types `CliConfig`, `ConfigRuntime`, `Credential`.
- Output/arg/error utilities: `formatJson`, `formatTable`, `formatDetail`,
  `parseArgs`, `getStringFlag`, `hasFlag`, `CliError`, `formatError`.

## Develop & publish

```bash
pnpm --filter @appelent/cli build       # tsup → dist/
pnpm --filter @appelent/cli test        # vitest
pnpm --filter @appelent/cli typecheck
pnpm --filter @appelent/cli lint         # biome
```

Publish per the repo's `PUBLISHING.md` (`build`, then
`pnpm --filter @appelent/cli publish --no-git-checks`; needs `NODE_AUTH_TOKEN`).
