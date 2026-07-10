# @appelent/cli

Reusable command-line scaffolding for Appelent apps. Ships the generic `auth`
and `config` commands (token-based login, credential storage, JSON/table
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
<appName> auth login --token <token>   # store a token credential
<appName> auth status [--json]         # signed-in / expired / not signed in
<appName> auth logout                  # clear the stored credential
<appName> config get [--json]          # print config (credential redacted)
<appName> config set api-url <value>
<appName> config set convex-url <value>
```

Browser login (`auth login` with no `--token`) is intentionally stubbed and
throws `Unsupported` — token auth is the only implemented path today.

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
		// runtime: { appName, defaultApiUrl, env, writeOut, writeErr }
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

## Public API

- `createCli(options)` → `{ runCli(args, ioRuntime) }` — the factory most apps use.
- `runCli(args, ioRuntime, options)` — lower-level entry the factory wraps.
- Types: `RunCliOptions`, `CliCommand`, `CliRuntime`, `IoRuntime`, `CliResult`.
- Auth helpers: `saveToken`, `requireCredential`, `getCredentialStatus`,
  `logout`, `decodeJwtExpiry`.
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
