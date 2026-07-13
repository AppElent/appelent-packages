# Appelent Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `appelent-packages` into the single feature catalog — one folder per feature under `skills/`, distributed as a Claude Code plugin with an `/appelent` front door and per-app `appelent.json` records — and retire the global registry, mirrors, and global skills.

**Architecture:** The repo doubles as a plugin marketplace and plugin. Each feature folder holds `FEATURE.md` (description: stack/architecture/configuration, integer-versioned) and `SKILL.md` (apply/update procedure). A dependency-free Node validator enforces the catalog contract. Apps record opt-ins in `appelent.json`; freshness = FEATURE.md version vs recorded version (plus npm semver for packages).

**Tech Stack:** Claude Code plugins (marketplace + skills + commands), open Agent Skills format (Codex-compatible), Node.js 22 built-ins (`node:test`), pnpm workspace (unchanged), PowerShell for the Codex junction script.

**Spec:** `docs/superpowers/specs/2026-07-13-appelent-features-design.md`

---

## Ground Rules For Executors

- This repo has unrelated uncommitted changes (`PUBLISHING.md`, `package.json`, `packages/cli/*`). Never `git add -A`. Stage only the files listed in each task's commit step.
- Tasks 2–6 move content out of `C:\Users\ericj\.claude\skills\*`. **Copy, never delete** — retirement happens in Task 12 by moving to a backup folder, and only after Task 9 proves the plugin works.
- `claude plugin validate` may not exist in older CLI versions. If the command is missing, substitute: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')); JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log('json ok')"` and note in the task commit message that manifest validation was JSON-only.
- All `git commit` messages end with the line: `Co-Authored-By: Claude <noreply@anthropic.com>`

## File Structure

New files in this repo (`D:\Dev\appelent-packages`):

```text
.claude-plugin/plugin.json          # plugin manifest, name "appelent"
.claude-plugin/marketplace.json     # repo doubles as its own marketplace
skills/appelent/SKILL.md            # front door: list/show/apply/capture/status
skills/baseline/SKILL.md            # from custom-bootstrap (project baseline)
skills/baseline/FEATURE.md
skills/auth/SKILL.md                # new, thin: apply @appelent/auth
skills/auth/FEATURE.md
skills/cli/SKILL.md                 # from add-cli
skills/cli/FEATURE.md
skills/i18n/SKILL.md                # from add-i18n
skills/i18n/FEATURE.md
skills/mcp/SKILL.md                 # from add-mcp-server (+ references/)
skills/mcp/FEATURE.md
skills/mcp/references/*.md
commands/appelent.md                # registers /appelent
scripts/validate-catalog.mjs        # catalog contract validator
scripts/setup-codex-skills.ps1      # Codex junction setup
tests/catalog.test.mjs              # node:test suite for the validator
projects.json                       # paths-only fleet list for status --all
```

Modified: root `package.json` (one script). Pilot app repo `D:\Dev\workouts`: new `appelent.json`, shrunk managed blocks, mirrors deleted. Retired (moved to backup): `C:\Users\ericj\.claude\appelent\`, five global skills.

---

### Task 1: Plugin and Marketplace Manifests

**Files:**
- Create: `D:\Dev\appelent-packages\.claude-plugin\plugin.json`
- Create: `D:\Dev\appelent-packages\.claude-plugin\marketplace.json`

- [ ] **Step 1: Write plugin.json**

```json
{
  "name": "appelent",
  "description": "Appelent feature catalog: shared design decisions (auth, cli, i18n, mcp, baseline) as applyable skills backed by @appelent/* packages",
  "version": "0.1.0",
  "author": {
    "name": "AppElent"
  },
  "repository": "https://github.com/AppElent/appelent-packages",
  "keywords": ["appelent", "features", "tanstack", "convex", "clerk", "cloudflare"]
}
```

- [ ] **Step 2: Write marketplace.json**

```json
{
  "name": "appelent",
  "description": "Marketplace hosting the appelent feature-catalog plugin",
  "owner": {
    "name": "AppElent"
  },
  "plugins": [
    {
      "name": "appelent",
      "source": "./",
      "description": "Appelent feature catalog: shared design decisions as applyable skills"
    }
  ]
}
```

- [ ] **Step 3: Validate**

Run from repo root: `claude plugin validate .`
Expected: validation passes (or use the JSON-only fallback from Ground Rules).

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat: add appelent plugin and marketplace manifests"
```

---

### Task 2: baseline Feature Folder

**Files:**
- Create: `D:\Dev\appelent-packages\skills\baseline\SKILL.md` (from `C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md`)
- Create: `D:\Dev\appelent-packages\skills\baseline\FEATURE.md`

- [ ] **Step 1: Copy the bootstrap skill**

```bash
mkdir -p skills/baseline
cp "C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md" skills/baseline/SKILL.md
```

- [ ] **Step 2: Replace the frontmatter**

Replace the existing `---`-delimited frontmatter block at the top of `skills/baseline/SKILL.md` with exactly:

```yaml
---
name: baseline
description: Use when bootstrapping a freshly scaffolded TanStack Start + Convex + Clerk + Cloudflare Workers app to the Appelent baseline, or when auditing an existing app for missing scripts, Convex env vars, wrangler deploy config, Windows/Biome hygiene, shared @appelent packages, or the GitHub Actions PR preview workflow. Applies the Appelent "baseline" feature and records it in the app's appelent.json.
---
```

- [ ] **Step 3: Rewrite retired-system references**

Run: `grep -n "appelent-registry\|capabilities.json\|projects.json\|\.claude.appelent\|managed-claude-section\|managed-agents-section\|mirror" skills/baseline/SKILL.md`

Rewrite every hit using this mapping (delete the step if nothing remains of it):

| Old reference | Replacement |
| --- | --- |
| Run `appelent-registry.mjs` / update `projects.json` / `capabilities.json` | Write or update `appelent.json` at the app root: ensure `features.baseline = { "version": 1 }` plus an entry for every feature applied during bootstrap (e.g. `auth`), committed together with the wiring |
| Stamp managed blocks from `managed-*-section.md` templates | Stamp the managed block using the exact text in the "Managed block" section below (same text for `CLAUDE.md` and `AGENTS.md`, between `<!-- appelent-managed:start -->` and `<!-- appelent-managed:end -->`) |
| Refresh the repo-local mirror (`.claude/appelent`, mirrored skills) | Delete: mirrors are retired. If `.claude/appelent/` or mirrored catalog skills exist in the app, remove them |

Then append this section at the end of the file:

````md
## Managed block

Replace everything between the markers in the app's `CLAUDE.md` and `AGENTS.md`
(add the block at the end of the file if the markers don't exist yet):

```md
<!-- appelent-managed:start -->
## Appelent Managed Project

This is an Appelent-managed app. Opted-in features and their options are
recorded in `appelent.json`. Feature definitions live in the `appelent`
plugin (locally installed) or https://github.com/AppElent/appelent-packages
(`skills/<feature>/FEATURE.md`).

Before adding functionality that could apply to multiple apps, check the
feature catalog first. To add or update a feature, use `/appelent`.
<!-- appelent-managed:end -->
```
````

- [ ] **Step 4: Write FEATURE.md**

Create `skills/baseline/FEATURE.md`:

```md
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
```

- [ ] **Step 5: Commit**

```bash
git add skills/baseline/SKILL.md skills/baseline/FEATURE.md
git commit -m "feat: add baseline feature (migrated from custom-bootstrap)"
```

---

### Task 3: auth Feature Folder

**Files:**
- Create: `D:\Dev\appelent-packages\skills\auth\FEATURE.md`
- Create: `D:\Dev\appelent-packages\skills\auth\SKILL.md`

- [ ] **Step 1: Read the package README**

Read `packages/auth/README.md` and `packages/auth/package.json` (for the export surface and current version). The SKILL.md below intentionally stays thin and defers to the README — keep it that way.

- [ ] **Step 2: Write FEATURE.md**

Create `skills/auth/FEATURE.md`:

```md
---
name: auth
version: 1
description: Clerk-based authentication UI and theming shared across Appelent apps
package: "@appelent/auth"
---

# Auth

## What

Shared authentication chrome and theming for Appelent apps: a router-free,
config-driven `HeaderUser` component, theme tokens (`tokens.css`), and
`THEME_INIT_SCRIPT` for no-flash theme initialization. Clerk provides the
actual auth; Convex consumes it via the JWT template named `convex`.

## Stack

- Package: `@appelent/auth` (GitHub Packages)
- Auth provider: Clerk (`@clerk/clerk-react` peer dependency)
- Backend bridge: Convex `auth.config.ts` with the `convex` JWT template

## Architecture

- Apps import UI from the package barrel export; app-specific look comes
  from configuration, not forks.
- `THEME_INIT_SCRIPT` is inlined in `__root.tsx` `<head>`.
- The package README (`packages/auth/README.md`) is the integration
  source of truth, including for non-Claude agents.

## Configuration

- `.npmrc` GitHub Packages mapping for the `@appelent` scope (baseline)
- Clerk env vars per the app's `@t3-oss/env-core` schema
- `tokens.css` imported in the app's root stylesheet

## Changelog

- 1 — initial capture
```

- [ ] **Step 3: Write SKILL.md**

Create `skills/auth/SKILL.md`:

```md
---
name: auth
description: Use when adding the Appelent auth feature (Clerk + @appelent/auth HeaderUser, theme tokens, THEME_INIT_SCRIPT) to an app, or updating an app's auth wiring to the current package version.
---

# auth

Read `FEATURE.md` in this folder first. Auth is package-owned: the
integration source of truth is `packages/auth/README.md` in
https://github.com/AppElent/appelent-packages (locally
`D:\Dev\appelent-packages\packages\auth`). Do not re-derive patterns from
scratch and do not fork package code into the app.

## Apply

1. `pnpm add @appelent/auth` (requires the baseline `.npmrc` scope mapping).
2. Follow the package README: mount `HeaderUser` config-driven in the app
   header, import `tokens.css`, inline `THEME_INIT_SCRIPT` in `__root.tsx`.
3. Verify Clerk → Convex JWT template `convex` exists (baseline owns this).
4. Record in `appelent.json` at the app root (same commit as the wiring):
   `"auth": { "version": 1 }`.

## Update

Compare the app's recorded version against this folder's `FEATURE.md`
version; apply the Changelog deltas. For package-only changes, a normal
`pnpm up @appelent/auth` suffices.
```

- [ ] **Step 4: Verify the `package` frontmatter claim**

Run: `node -e "const p=require('./packages/auth/package.json'); if(p.name!=='@appelent/auth'){process.exit(1)}; console.log('package ok')"`
Expected: `package ok`

- [ ] **Step 5: Commit**

```bash
git add skills/auth/FEATURE.md skills/auth/SKILL.md
git commit -m "feat: add auth feature folder"
```

---

### Task 4: cli Feature Folder

**Files:**
- Create: `D:\Dev\appelent-packages\skills\cli\SKILL.md` (from `C:\Users\ericj\.claude\skills\add-cli\SKILL.md`)
- Create: `D:\Dev\appelent-packages\skills\cli\FEATURE.md`

- [ ] **Step 1: Copy and adapt the skill**

```bash
mkdir -p skills/cli
cp "C:\Users\ericj\.claude\skills\add-cli\SKILL.md" skills/cli/SKILL.md
```

Then make exactly these edits to `skills/cli/SKILL.md`:

1. Replace the frontmatter `name: add-cli` line with `name: cli`.
2. In the frontmatter description, keep the text but ensure it starts with "Use when adding a command-line interface to an Appelent app."
3. Replace the heading `# add-cli` with `# cli`.
4. Replace list item 4 under "## To add CLI to an app" (the one referencing `custom-bootstrap` registry step / `appelent-registry.mjs ... --capability cli`) with:

```md
4. Record in `appelent.json` at the app root (same commit as the wiring):
   `"cli": { "version": 1 }`.
```

5. Replace both remaining references to `custom-bootstrap` step 7 with: "the `baseline` feature (shared `@appelent` packages step)".

- [ ] **Step 2: Write FEATURE.md**

Create `skills/cli/FEATURE.md`:

```md
---
name: cli
version: 1
description: Repo-local command-line interface for an Appelent app via @appelent/cli
package: "@appelent/cli"
---

# CLI

## What

A per-app CLI (`pnpm <app> ...`) built on the shared `@appelent/cli`
package: browser login/auth flow, config store, Convex client factory,
output formatting, and command registration plumbing. Apps add only their
domain commands.

## Stack

- Package: `@appelent/cli` (GitHub Packages)
- Runner: `tsx` executing a thin `cli/index.ts` wrapper (repo-local; no app
  publishing needed)

## Architecture

- `cli/index.ts` wraps `createCli({ appName: "<app>" })`.
- App-specific commands go in the app via the `commands: CliCommand[]`
  option — never forked into the shared package.
- Reference implementation: the `workouts` repo.

## Configuration

- Script `"<app>": "tsx cli/index.ts"` plus a `cli:smoke` script
  (`--help`, `config get --json`, `auth status`)
- CI workflow installing with GitHub Packages auth and running the smoke

## Changelog

- 1 — initial capture (migrated from the `add-cli` global skill)
```

- [ ] **Step 3: Verify the `package` frontmatter claim**

Run: `node -e "const p=require('./packages/cli/package.json'); if(p.name!=='@appelent/cli'){process.exit(1)}; console.log('package ok')"`
Expected: `package ok`

- [ ] **Step 4: Commit**

```bash
git add skills/cli/SKILL.md skills/cli/FEATURE.md
git commit -m "feat: add cli feature folder (migrated from add-cli)"
```

---

### Task 5: i18n Feature Folder

**Files:**
- Create: `D:\Dev\appelent-packages\skills\i18n\SKILL.md` (from `C:\Users\ericj\.claude\skills\add-i18n\SKILL.md`)
- Create: `D:\Dev\appelent-packages\skills\i18n\FEATURE.md`

- [ ] **Step 1: Copy and adapt the skill**

```bash
mkdir -p skills/i18n
cp "C:\Users\ericj\.claude\skills\add-i18n\SKILL.md" skills/i18n/SKILL.md
```

Then make exactly these edits to `skills/i18n/SKILL.md`:

1. Frontmatter: `name: add-i18n` → `name: i18n`; heading `# add-i18n` → `# i18n`.
2. Replace the paragraph starting "Before starting: check `C:\Users\ericj\.claude\appelent\capabilities.json`..." with:

```md
Before starting: confirm the target project's `package.json`/`.npmrc`
already supports installing from the private GitHub Packages registry (see
how `@appelent/auth` is wired in for the pattern to copy — the `baseline`
feature owns this).
```

3. Append a new final section:

```md
## Record the feature

After the wiring commit compiles and tests pass, record in `appelent.json`
at the app root (same commit as the wiring), including the locale choice:

    "i18n": { "version": 1, "options": { "locales": ["en", "nl"] } }
```

- [ ] **Step 2: Write FEATURE.md**

Create `skills/i18n/FEATURE.md`:

```md
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
```

- [ ] **Step 3: Verify the `package` frontmatter claim**

Run: `node -e "const p=require('./packages/i18n/package.json'); if(p.name!=='@appelent/i18n'){process.exit(1)}; console.log('package ok')"`
Expected: `package ok`

- [ ] **Step 4: Commit**

```bash
git add skills/i18n/SKILL.md skills/i18n/FEATURE.md
git commit -m "feat: add i18n feature folder (migrated from add-i18n)"
```

---

### Task 6: mcp Feature Folder

**Files:**
- Create: `D:\Dev\appelent-packages\skills\mcp\SKILL.md` (from `C:\Users\ericj\.claude\skills\add-mcp-server\SKILL.md`)
- Create: `D:\Dev\appelent-packages\skills\mcp\references\` (copied folder: `auth.md`, `cloudflare-worker.md`, `tanstack-start-cloudflare.md`, `testing.md`)
- Create: `D:\Dev\appelent-packages\skills\mcp\FEATURE.md`

- [ ] **Step 1: Copy skill and references**

```bash
mkdir -p skills/mcp
cp "C:\Users\ericj\.claude\skills\add-mcp-server\SKILL.md" skills/mcp/SKILL.md
cp -r "C:\Users\ericj\.claude\skills\add-mcp-server\references" skills/mcp/references
```

- [ ] **Step 2: Adapt the skill**

Edits to `skills/mcp/SKILL.md`:

1. Frontmatter `name: add-mcp-server` → `name: mcp`; heading `# add-mcp-server` → `# mcp`.
2. Run `grep -n "capabilities.json\|appelent-registry\|\.claude.appelent" skills/mcp/SKILL.md` and rewrite each hit: the registry lookup under "## 1. Discover The Target" becomes "Feature record: `appelent.json` at the app root (`mcp` entry, if present)". Any "register the capability" instruction becomes:

```md
Record in `appelent.json` at the app root (same commit as the wiring),
including the chosen options, e.g.:

    "mcp": { "version": 1, "options": { "lib": "tanstack-ai-mcp", "deploy": "cloudflare-workers" } }
```

- [ ] **Step 3: Write FEATURE.md**

Create `skills/mcp/FEATURE.md`:

```md
---
name: mcp
version: 1
description: How Appelent apps expose a Model Context Protocol (MCP) server
---

# MCP server

## What

The standard way an Appelent app exposes MCP tools: transport choice,
endpoint wiring, auth, tests, and MCP Inspector verification. Currently
documented/guided (no `@appelent/mcp` package): create a package only when
two or more apps need the same imported runtime helpers.

## Stack

- Options: `lib: tanstack-ai-mcp | @modelcontextprotocol/sdk`;
  `deploy: cloudflare-workers` (the only described deploy target)
- Host app shape: TanStack Start on Cloudflare Workers

## Architecture

- App-specific MCP tools, domain logic, and permission rules live in the
  app; see `references/tanstack-start-cloudflare.md` and
  `references/cloudflare-worker.md` for endpoint wiring per option
- Auth decisions: `references/auth.md`

## Configuration

- Wrangler/route config per `references/cloudflare-worker.md`
- Tests + MCP Inspector verification per `references/testing.md`

## Changelog

- 1 — initial capture (migrated from the `add-mcp-server` global skill)
```

- [ ] **Step 4: Commit**

```bash
git add skills/mcp
git commit -m "feat: add mcp feature folder (migrated from add-mcp-server)"
```

---

### Task 7: Catalog Validator (TDD)

**Files:**
- Create: `D:\Dev\appelent-packages\scripts\validate-catalog.mjs`
- Test: `D:\Dev\appelent-packages\tests\catalog.test.mjs`
- Modify: `D:\Dev\appelent-packages\package.json` (add script)

- [ ] **Step 1: Write the failing test**

Create `tests/catalog.test.mjs`:

```js
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { validateCatalog } from "../scripts/validate-catalog.mjs";

function makeRepo() {
	const root = mkdtempSync(join(tmpdir(), "appelent-catalog-"));
	mkdirSync(join(root, "skills", "appelent"), { recursive: true });
	writeFileSync(
		join(root, "skills", "appelent", "SKILL.md"),
		"---\nname: appelent\ndescription: front door\n---\n# appelent\n",
	);
	return root;
}

function writeFeature(root, name, { featureMd, skillMd } = {}) {
	const dir = join(root, "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, "FEATURE.md"),
		featureMd ??
			`---\nname: ${name}\nversion: 1\ndescription: d\n---\n# x\n\n## What\nw\n\n## Stack\ns\n\n## Architecture\na\n\n## Configuration\nc\n\n## Changelog\n- 1 — initial\n`,
	);
	writeFileSync(
		join(dir, "SKILL.md"),
		skillMd ?? `---\nname: ${name}\ndescription: use when x\n---\n# ${name}\n`,
	);
	return dir;
}

test("valid feature folder passes", () => {
	const root = makeRepo();
	writeFeature(root, "mcp");
	assert.deepEqual(validateCatalog(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("missing FEATURE.md section is reported", () => {
	const root = makeRepo();
	writeFeature(root, "mcp", {
		featureMd:
			"---\nname: mcp\nversion: 1\ndescription: d\n---\n# x\n\n## What\nw\n\n## Stack\ns\n\n## Architecture\na\n\n## Configuration\nc\n",
	});
	const errors = validateCatalog(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /mcp.*Changelog/);
	rmSync(root, { recursive: true, force: true });
});

test("frontmatter name must match folder, version must be positive integer", () => {
	const root = makeRepo();
	writeFeature(root, "mcp", {
		featureMd:
			"---\nname: wrong\nversion: 1.5\ndescription: d\n---\n# x\n\n## What\nw\n\n## Stack\ns\n\n## Architecture\na\n\n## Configuration\nc\n\n## Changelog\n- 1 — initial\n",
	});
	const errors = validateCatalog(root);
	assert.equal(errors.length, 2);
	rmSync(root, { recursive: true, force: true });
});

test("package frontmatter must point at an existing workspace package with that npm name", () => {
	const root = makeRepo();
	writeFeature(root, "i18n", {
		featureMd:
			'---\nname: i18n\nversion: 1\ndescription: d\npackage: "@appelent/i18n"\n---\n# x\n\n## What\nw\n\n## Stack\ns\n\n## Architecture\na\n\n## Configuration\nc\n\n## Changelog\n- 1 — initial\n',
	});
	const missing = validateCatalog(root);
	assert.equal(missing.length, 1);
	assert.match(missing[0], /i18n.*packages/);

	mkdirSync(join(root, "packages", "i18n"), { recursive: true });
	writeFileSync(
		join(root, "packages", "i18n", "package.json"),
		JSON.stringify({ name: "@appelent/i18n" }),
	);
	assert.deepEqual(validateCatalog(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("SKILL.md must have name and description frontmatter", () => {
	const root = makeRepo();
	writeFeature(root, "mcp", { skillMd: "# mcp\nno frontmatter\n" });
	const errors = validateCatalog(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /mcp.*SKILL\.md/);
	rmSync(root, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/catalog.test.mjs`
Expected: FAIL — cannot find module `../scripts/validate-catalog.mjs`.

- [ ] **Step 3: Write the validator**

Create `scripts/validate-catalog.mjs`:

```js
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_SECTIONS = ["What", "Stack", "Architecture", "Configuration", "Changelog"];

function parseFrontmatter(text) {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;
	const data = {};
	for (const line of match[1].split(/\r?\n/)) {
		const kv = line.match(/^(\w+):\s*(.*)$/);
		if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
	}
	return data;
}

export function validateCatalog(root) {
	const errors = [];
	const skillsDir = join(root, "skills");
	const features = readdirSync(skillsDir, { withFileTypes: true })
		.filter((e) => e.isDirectory() && e.name !== "appelent")
		.map((e) => e.name);

	for (const name of features) {
		const dir = join(skillsDir, name);

		const skillPath = join(dir, "SKILL.md");
		const skillFm = existsSync(skillPath)
			? parseFrontmatter(readFileSync(skillPath, "utf8"))
			: null;
		if (!skillFm?.name || !skillFm?.description) {
			errors.push(`${name}: SKILL.md missing or lacks name/description frontmatter`);
		}

		const featurePath = join(dir, "FEATURE.md");
		if (!existsSync(featurePath)) {
			errors.push(`${name}: FEATURE.md missing`);
			continue;
		}
		const text = readFileSync(featurePath, "utf8");
		const fm = parseFrontmatter(text) ?? {};
		if (fm.name !== name) {
			errors.push(`${name}: FEATURE.md frontmatter name "${fm.name}" does not match folder`);
		}
		if (!/^[1-9]\d*$/.test(fm.version ?? "")) {
			errors.push(`${name}: FEATURE.md version "${fm.version}" is not a positive integer`);
		}
		for (const section of REQUIRED_SECTIONS) {
			if (!new RegExp(`^## ${section}\\s*$`, "m").test(text)) {
				errors.push(`${name}: FEATURE.md missing required section "## ${section}"`);
			}
		}
		if (fm.package) {
			const pkgJsonPath = join(root, "packages", name, "package.json");
			let ok = false;
			if (existsSync(pkgJsonPath)) {
				ok = JSON.parse(readFileSync(pkgJsonPath, "utf8")).name === fm.package;
			}
			if (!ok) {
				errors.push(
					`${name}: FEATURE.md declares package "${fm.package}" but packages/${name}/package.json does not match`,
				);
			}
		}
	}
	return errors;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
	const errors = validateCatalog(process.cwd());
	for (const e of errors) console.error(`ERROR: ${e}`);
	console.log(errors.length === 0 ? "catalog ok" : `${errors.length} error(s)`);
	process.exit(errors.length === 0 ? 0 : 1);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/catalog.test.mjs`
Expected: all 5 tests PASS.

- [ ] **Step 5: Add the root script and run against the real catalog**

In root `package.json`, add to `"scripts"` (keep existing scripts untouched — the file has unrelated uncommitted edits, stage carefully):

```json
"validate:catalog": "node scripts/validate-catalog.mjs && node --test tests/catalog.test.mjs"
```

Run: `pnpm validate:catalog`
Expected: `catalog ok` and 5 passing tests. Fix any FEATURE.md contract violations from Tasks 2–6 now.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-catalog.mjs tests/catalog.test.mjs
git add -p package.json   # stage ONLY the validate:catalog script line
git commit -m "feat: add catalog contract validator with tests"
```

---

### Task 8: Front Door Skill, Command, and Fleet List

**Files:**
- Create: `D:\Dev\appelent-packages\skills\appelent\SKILL.md`
- Create: `D:\Dev\appelent-packages\commands\appelent.md`
- Create: `D:\Dev\appelent-packages\projects.json`

- [ ] **Step 1: Write the front door skill**

Create `skills/appelent/SKILL.md`:

````md
---
name: appelent
description: Front door for the Appelent feature catalog. Use when the user wants to list available Appelent features, show how a feature works, apply a feature to an app (add auth/cli/i18n/mcp/baseline), capture a new feature/design decision, or check an app's feature status/freshness.
---

# appelent

Operate on the sibling feature folders of this skill: every directory next
to this one (`../<feature>/`) that is not `appelent` is a feature, with
`FEATURE.md` (description, integer `version`, optional `package`
frontmatter) and `SKILL.md` (apply/update procedure).

Subcommands (also reachable by natural language):

## list

For each feature folder read the FEATURE.md frontmatter and print a table:
name, description, version, stage. Stage rules:

- `packaged` — frontmatter has `package:`
- `guided` — no package, but SKILL.md contains a numbered apply procedure
- `documented` — everything else

If run inside an app repo with an `appelent.json`, add an "installed"
column with the app's recorded version per feature.

## show <feature>

Read `../<feature>/FEATURE.md` and summarize it: What, Stack (including
supported options), Architecture, Configuration, and the Changelog tail.

## apply <feature> [options...]

1. Read `../<feature>/FEATURE.md`. Check requested options (e.g. "using
   tanstack-ai-mcp on cloudflare") against the Stack section. If an option
   is not described there, STOP: tell the user which options are
   supported and offer to extend FEATURE.md first (in the catalog repo,
   bumping `version` with a Changelog line). Never wire undescribed stacks.
2. Follow `../<feature>/SKILL.md` to do the wiring in the current app.
3. Record the result in `appelent.json` at the app root, in the same
   commit as the wiring: `"<feature>": { "version": <FEATURE.md version>,
   "options": { ... } }` (omit `options` if none were chosen). Create the
   file with `{ "features": {} }` shape if missing.

With `--update`: read the app's recorded version, apply only the
Changelog deltas between recorded and current, then update the recorded
version.

## capture <topic>

Interview the user about the design decision (what, stack, architecture,
configuration), then in the catalog repo checkout
(`D:\Dev\appelent-packages`) create `skills/<topic>/FEATURE.md` at
`version: 1` following the contract (frontmatter name/version/description
+ sections What/Stack/Architecture/Configuration/Changelog) and a stub
`skills/<topic>/SKILL.md` whose body says to read FEATURE.md before
building `<topic>` functionality. Run `pnpm validate:catalog` there, then
commit both files.

## status [--all]

For the current app (or for each path in the catalog repo's
`projects.json` when `--all`; skip and report missing paths, never fail):

1. Read `appelent.json`; for each recorded feature compare its version to
   the catalog FEATURE.md version. Report: up to date, or behind (show
   the Changelog lines between the versions and offer `apply --update`).
2. For packaged features, check `@appelent/*` versions in the app's
   `package.json` against the workspace package versions; report outdated.
3. Report mismatches both ways: recorded-but-no-evidence and
   evidence-but-not-recorded (e.g. `@appelent/i18n` in dependencies but no
   `i18n` entry). Propose the fix; never silently edit the app.
````

- [ ] **Step 2: Write the command**

Create `commands/appelent.md`:

```md
---
description: Appelent feature catalog — list, show, apply, capture, status
argument-hint: "list | show <feature> | apply <feature> [options] | capture <topic> | status [--all]"
---

Use the `appelent` skill from this plugin to handle: $ARGUMENTS

If no arguments were given, run the `list` subcommand and briefly explain
the other subcommands.
```

- [ ] **Step 3: Write the fleet list**

Create `projects.json` (paths-only, machine-specific, used by `status --all`):

```json
{
  "schemaVersion": 1,
  "projects": [
    "D:\\Dev\\games",
    "D:\\Dev\\gather",
    "D:\\Dev\\golf-app",
    "D:\\Dev\\roadmaps",
    "D:\\Dev\\satisfactory",
    "D:\\Dev\\workouts"
  ]
}
```

- [ ] **Step 4: Validate**

Run: `pnpm validate:catalog`
Expected: `catalog ok` (the `appelent` folder is exempt from the FEATURE.md contract by the validator).
Run: `claude plugin validate .` (or JSON fallback per Ground Rules).
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add skills/appelent/SKILL.md commands/appelent.md projects.json
git commit -m "feat: add /appelent front door and fleet list"
```

---

### Task 9: Install the Plugin Locally and Smoke Test

**Files:** none created in the repo (local machine state + verification).

- [ ] **Step 1: Add the local marketplace and install**

```bash
claude plugin marketplace add D:\Dev\appelent-packages
claude plugin install appelent@appelent
```

Expected: both commands succeed. If `marketplace add` rejects the path form, run it from inside the repo with `claude plugin marketplace add .`.

- [ ] **Step 2: Smoke test in a fresh session**

Start a new Claude Code session in `D:\Dev\workouts` and run `/appelent list`.
Expected: a table with baseline, auth, cli, i18n, mcp — correct stages (auth/cli/i18n `packaged`, baseline `guided`, mcp `guided` or `documented`) and versions all `1`.

Then run `/appelent show mcp`.
Expected: a summary naming the two supported `lib` options and the cloudflare-workers deploy target.

- [ ] **Step 3: Record the update procedure**

Verify `claude plugin update appelent` runs without error (it should re-sync from the local path). This is the standing update command; on other machines the marketplace is added from GitHub instead: `claude plugin marketplace add AppElent/appelent-packages`.

No commit for this task.

---

### Task 10: Codex Junction Setup Script

**Files:**
- Create: `D:\Dev\appelent-packages\scripts\setup-codex-skills.ps1`

- [ ] **Step 1: Write the script**

Create `scripts/setup-codex-skills.ps1`:

```powershell
# Links every feature folder in this repo's skills/ into ~/.codex/skills
# as a directory junction, so Codex discovers the same Agent Skills files
# Claude Code gets via the plugin. Re-run after adding a feature.
$ErrorActionPreference = "Stop"

$repoSkills = Join-Path $PSScriptRoot "..\skills" | Resolve-Path
$codexSkills = Join-Path $HOME ".codex\skills"
New-Item -ItemType Directory -Force -Path $codexSkills | Out-Null

Get-ChildItem -Path $repoSkills -Directory | ForEach-Object {
    $link = Join-Path $codexSkills $_.Name
    if (Test-Path $link) {
        Write-Host "exists: $($_.Name)"
    } else {
        New-Item -ItemType Junction -Path $link -Target $_.FullName | Out-Null
        Write-Host "linked: $($_.Name)"
    }
}
```

- [ ] **Step 2: Run it**

Run: `powershell -ExecutionPolicy Bypass -File scripts/setup-codex-skills.ps1`
Expected: `linked: <name>` for appelent, auth, baseline, cli, i18n, mcp (or `exists:` on re-run).

- [ ] **Step 3: Verify Codex discovery**

If the `codex` CLI is installed: start `codex` in any directory and run `/skills`; expected: the six skills appear. If Codex is not installed on this machine, verify the junctions resolve instead: `Get-ChildItem "$HOME\.codex\skills\i18n"` shows `SKILL.md` and `FEATURE.md`. Note the result in the commit message.

- [ ] **Step 4: Commit**

```bash
git add scripts/setup-codex-skills.ps1
git commit -m "feat: add Codex skills junction setup script"
```

---

### Task 11: Pilot App Migration (workouts)

**Files (in `D:\Dev\workouts` — a different repo; commit there, not here):**
- Create: `D:\Dev\workouts\appelent.json`
- Modify: `D:\Dev\workouts\CLAUDE.md` (managed block only)
- Modify: `D:\Dev\workouts\AGENTS.md` (managed block only)
- Delete: `D:\Dev\workouts\.claude\appelent\` and mirrored catalog skills (see Step 3)

- [ ] **Step 1: Check the workouts repo is clean**

Run in `D:\Dev\workouts`: `git status --short`
Expected: clean (or only unrelated files — if so, stage only this task's files later).

- [ ] **Step 2: Write appelent.json**

Create `D:\Dev\workouts\appelent.json` (workouts had `auth` + `cli` in the old registry; baseline was applied by custom-bootstrap):

```json
{
  "features": {
    "baseline": { "version": 1 },
    "auth": { "version": 1 },
    "cli": { "version": 1 }
  }
}
```

- [ ] **Step 3: Shrink managed blocks and delete mirrors**

In both `CLAUDE.md` and `AGENTS.md`, replace everything between
`<!-- appelent-managed:start -->` and `<!-- appelent-managed:end -->`
(markers inclusive) with the managed block defined in Task 2 Step 3.

Delete the mirror: `D:\Dev\workouts\.claude\appelent\` (whole folder). Under `D:\Dev\workouts\.claude\skills\`, delete only mirrored catalog skills (`add-cli`, `add-i18n`, `add-mcp-server`, and any `projects.managed`/`capabilities.managed` artifacts). Keep app-local skills such as `verify`, `review-app`, `review-session`.

- [ ] **Step 4: Verify with the front door**

In a Claude session in `D:\Dev\workouts`, run `/appelent status`.
Expected: baseline/auth/cli up to date; no recorded-but-missing or evidence-but-unrecorded mismatches (if `@appelent/i18n` etc. surfaces, fix `appelent.json` accordingly).

- [ ] **Step 5: Commit (in the workouts repo)**

```bash
git add appelent.json CLAUDE.md AGENTS.md .claude
git commit -m "chore: migrate to appelent feature catalog (appelent.json, shrunk managed block, mirrors removed)"
```

The other five apps migrate the same way on next touch — not part of this plan.

---

### Task 12: Retire the Global Machinery

**Files (global, outside any git repo — move, never delete):**
- Move: `C:\Users\ericj\.claude\appelent\` → `C:\Users\ericj\.claude\appelent-retired-20260713\`
- Move: five skills from `C:\Users\ericj\.claude\skills\` → `C:\Users\ericj\.claude\skills-retired-20260713\`

- [ ] **Step 1: Preconditions**

Only proceed if Task 9 Step 2 (smoke test) passed. Preserve `improvements.md`: copy `C:\Users\ericj\.claude\appelent\improvements.md` into `D:\Dev\appelent-packages\docs\improvements.md` first, and `git add docs/improvements.md` + commit it in this repo with message `docs: carry over improvements notes from retired registry`.

- [ ] **Step 2: Move the registry and old skills to backup**

```powershell
Move-Item "C:\Users\ericj\.claude\appelent" "C:\Users\ericj\.claude\appelent-retired-20260713"
New-Item -ItemType Directory "C:\Users\ericj\.claude\skills-retired-20260713" | Out-Null
foreach ($s in "custom-bootstrap","audit-appelent-projects","add-cli","add-i18n","add-mcp-server") {
  Move-Item "C:\Users\ericj\.claude\skills\$s" "C:\Users\ericj\.claude\skills-retired-20260713\$s"
}
```

- [ ] **Step 3: Verify nothing references the retired paths**

Run: `grep -rn "claude.appelent\|appelent-registry\|custom-bootstrap\|add-cli\|add-i18n\|add-mcp-server\|audit-appelent-projects" D:\Dev\appelent-packages\skills D:\Dev\appelent-packages\commands`
Expected: no hits pointing at `C:\Users\ericj\.claude` paths (mentions of the retired skill *names* in FEATURE.md Changelog lines are fine).

Also verify in a fresh Claude session that `/appelent list` still works and the old skills no longer appear as available.

- [ ] **Step 4: Commit** — nothing to commit in this repo for the moves; the backup folders are deleted manually by the user later once confident.

---

### Task 13: Repo Docs

**Files:**
- Modify: `D:\Dev\appelent-packages\README.md` (create if missing)

- [ ] **Step 1: Document the catalog**

Add (or create the file with) a section:

```md
## Feature catalog

This repo is the Appelent feature catalog and a Claude Code plugin.
Each folder under `skills/` is one feature (a shared design decision):
`FEATURE.md` describes it (stack, architecture, configuration, versioned
changelog), `SKILL.md` applies it to an app. Packaged features have their
runtime code under `packages/`.

- Install (Claude Code): `claude plugin marketplace add AppElent/appelent-packages`
  then `claude plugin install appelent@appelent`. Local dev on this
  machine: `claude plugin marketplace add D:\Dev\appelent-packages`.
- Update: `claude plugin update appelent`.
- Codex: `powershell -File scripts/setup-codex-skills.ps1` (junctions into
  `~/.codex/skills`).
- Front door: `/appelent list | show | apply | capture | status`.
- Apps record opt-ins in their own `appelent.json`.
- Contract check: `pnpm validate:catalog`.
```

- [ ] **Step 2: Validate and commit**

Run: `pnpm validate:catalog` — expected: `catalog ok`.

```bash
git add README.md
git commit -m "docs: document the feature catalog and plugin usage"
```

---

## Self-Review Notes

- **Spec coverage:** concept model + layout (Tasks 2–6), FEATURE.md/SKILL.md contracts (Tasks 2–7, enforced by Task 7), front door incl. option-checking and update path (Task 8), appelent.json + freshness/status (Tasks 8, 11), distribution/updates (Tasks 1, 9), Codex story (Task 10), managed blocks (Tasks 2, 11), retirements incl. custom-bootstrap→baseline and audit→status (Tasks 2, 8, 12), error handling (encoded in the front-door skill text), out-of-scope items untouched.
- **Known judgment steps:** Tasks 2 and 6 rewrite registry references inside migrated skill bodies via grep + mapping table — content varies, so exact diffs are impossible; the mapping table is the contract.
- **Type consistency:** `appelent.json` shape (`{ "features": { name: { version, options? } } }`), FEATURE.md frontmatter keys (`name`, `version`, `description`, optional `package`), and stage names (`documented|guided|packaged`) are identical across Tasks 2–11.
