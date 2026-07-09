# Appelent Managed Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the global Appelent managed-project registry, repo-local web mirror, managed `CLAUDE.md` / `AGENTS.md` blocks, and audit workflow described in the approved design.

**Architecture:** Canonical data and reusable skills live under `C:\Users\ericj\.claude`. A small dependency-free Node helper owns JSON updates, marker-block replacement, mirror refresh, and read-only audits. `custom-bootstrap` and capability skills call that helper instead of editing registry files by hand.

**Tech Stack:** Claude Code global skills, Markdown command launchers, Node.js 22 built-in modules, Node built-in test runner, JSON registry files.

---

## Scope Check

The approved spec covers one cohesive process layer: global registry, managed repo instructions, repo-local mirrors, and audit. It is acceptable as one implementation plan because each task produces independently testable process tooling that supports the same Appelent managed-project workflow.

This plan intentionally does not implement `@appelent/cli` or a full `add-i18n` capability. It registers capability metadata and adds the hooks that future capability skills must use.

## File Structure

Global canonical files:

- Create: `C:\Users\ericj\.claude\appelent\projects.json`
  - Stores managed project paths, baseline names, and capability lists.
- Create: `C:\Users\ericj\.claude\appelent\capabilities.json`
  - Stores capability ownership metadata.
- Create: `C:\Users\ericj\.claude\appelent\managed-claude-section.md`
  - Canonical managed marker block for `CLAUDE.md`.
- Create: `C:\Users\ericj\.claude\appelent\managed-agents-section.md`
  - Canonical managed marker block for `AGENTS.md`.
- Create: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`
  - Dependency-free Node helper for registry, docs, mirror, and audit actions.
- Create: `C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs`
  - Built-in Node tests for marker-block replacement, registry updates, mirror refresh, and audit drift detection.

Global skills and commands:

- Modify: `C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md`
  - Adds the Appelent managed-project registry/mirror step to bootstrap.
- Create: `C:\Users\ericj\.claude\skills\audit-appelent-projects\SKILL.md`
  - Tells agents how to run and interpret the audit helper.
- Create: `C:\Users\ericj\.claude\commands\audit-appelent-projects.md`
  - Claude command launcher for the audit skill.

Repo-local files created by the helper for each managed app:

- Create or refresh: `<repo>\.claude\appelent\projects.managed.json`
- Create or refresh: `<repo>\.claude\appelent\capabilities.managed.json`
- Create or refresh selected mirror skills under: `<repo>\.claude\skills\`
- Modify managed marker block in: `<repo>\CLAUDE.md`
- Modify managed marker block in: `<repo>\AGENTS.md`

Global files under `C:\Users\ericj\.claude` are outside the normal workspace git repos. Do not run `git commit` there unless `git status` proves that folder is a git repository. Repo-local mirror changes are committed in each target app repo when `custom-bootstrap` runs there.

---

### Task 1: Create Global Registry Templates

**Files:**
- Create: `C:\Users\ericj\.claude\appelent\projects.json`
- Create: `C:\Users\ericj\.claude\appelent\capabilities.json`
- Create: `C:\Users\ericj\.claude\appelent\managed-claude-section.md`
- Create: `C:\Users\ericj\.claude\appelent\managed-agents-section.md`

- [ ] **Step 1: Check whether global config is git-tracked**

Run:

```powershell
git status --short
```

from:

```text
C:\Users\ericj\.claude
```

Expected:

- If it succeeds, note that global config changes can be committed at the end of each task.
- If it fails with `fatal: not a git repository`, continue without a global commit and rely on the repo-local mirrors for versioned copies.

- [ ] **Step 2: Create the global Appelent config folder**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ericj\.claude\appelent | Select-Object FullName
```

Expected: output includes `C:\Users\ericj\.claude\appelent`.

- [ ] **Step 3: Create `projects.json`**

Write exactly:

```json
{
  "schemaVersion": 1,
  "projects": {
    "games": {
      "path": "D:\\Dev\\games",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth"]
    },
    "gather": {
      "path": "D:\\Dev\\gather",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": []
    },
    "golf-app": {
      "path": "D:\\Dev\\golf-app",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth"]
    },
    "roadmaps": {
      "path": "D:\\Dev\\roadmaps",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth"]
    },
    "satisfactory": {
      "path": "D:\\Dev\\satisfactory",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth"]
    },
    "workouts": {
      "path": "D:\\Dev\\workouts",
      "baseline": "tanstack-convex-clerk-cloudflare",
      "capabilities": ["auth", "cli"]
    }
  }
}
```

Rationale: the initial set matches the existing `bootstrap-all` default list. `gather` is included because it is already in that list, but it starts with no capability claim until audit confirms its actual dependencies.

- [ ] **Step 4: Create `capabilities.json`**

Write exactly:

```json
{
  "schemaVersion": 1,
  "capabilities": {
    "auth": {
      "owner": "package",
      "package": "@appelent/auth",
      "status": "active"
    },
    "cli": {
      "owner": "capability-skill",
      "skill": "add-cli",
      "package": "@appelent/cli",
      "status": "candidate"
    },
    "i18n": {
      "owner": "capability-skill",
      "skill": "add-i18n",
      "package": null,
      "status": "candidate"
    }
  }
}
```

- [ ] **Step 5: Create `managed-claude-section.md`**

Write exactly:

```md
<!-- appelent-managed:start -->
## Appelent Managed Project

This repo follows the shared Appelent project baseline.

Source of truth:
- `C:\Users\ericj\.claude\appelent\projects.json`
- `C:\Users\ericj\.claude\appelent\capabilities.json`
- `C:\Users\ericj\.claude\skills`

Web/browser fallback:
- `.claude\appelent`
- `.claude\skills`

Before adding functionality that could apply to multiple apps, check whether it belongs in:
- an existing or new `@appelent/*` package
- `custom-bootstrap`
- a capability skill such as `add-cli` or `add-i18n`

If you add, remove, or generalize cross-app functionality, update the Appelent registry files or explain why no registry change is needed.
<!-- appelent-managed:end -->
```

- [ ] **Step 6: Create `managed-agents-section.md`**

Write exactly:

```md
<!-- appelent-managed:start -->
## Appelent Managed Project

Read `CLAUDE.md` first.

Primary local source:
- `C:\Users\ericj\.claude\appelent`
- `C:\Users\ericj\.claude\skills`

Web/browser fallback committed in this repo:
- `.claude\appelent`
- `.claude\skills`

When adding generic functionality, prefer existing `@appelent/*` packages, bootstrap conventions, or capability skills before creating a new local-only pattern.

If global and repo-local instructions differ, prefer the global source locally. In web/browser environments, use the repo-local mirror and flag the drift.
<!-- appelent-managed:end -->
```

- [ ] **Step 7: Validate JSON files**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('C:\\Users\\ericj\\.claude\\appelent\\projects.json','utf8')); JSON.parse(require('fs').readFileSync('C:\\Users\\ericj\\.claude\\appelent\\capabilities.json','utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 8: Commit if global config is git-tracked**

If `C:\Users\ericj\.claude` is a git repo, run:

```powershell
git add appelent\projects.json appelent\capabilities.json appelent\managed-claude-section.md appelent\managed-agents-section.md
git commit -m "chore: add appelent managed project registry"
```

If it is not a git repo, record in the implementation summary: `Global Claude config is not git-tracked; no global commit created.`

---

### Task 2: Add Registry Helper Tests

**Files:**
- Create: `C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs`
- Create later in Task 3: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`

- [ ] **Step 1: Create tests directory**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ericj\.claude\appelent\tests | Select-Object FullName
```

Expected: output includes `C:\Users\ericj\.claude\appelent\tests`.

- [ ] **Step 2: Write the failing tests**

Create `C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs` with:

```js
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  auditProjects,
  ensureCapability,
  refreshManagedDocs,
  refreshMirror,
  registerProject,
  replaceManagedBlock,
} from "../scripts/appelent-registry.mjs";

async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "appelent-registry-"));
  const globalRoot = path.join(root, "global", "appelent");
  const skillsRoot = path.join(root, "global", "skills");
  const repo = path.join(root, "repo");
  await writeFile(path.join(root, "sentinel"), "x");
  await import("node:fs/promises").then(async (fs) => {
    await fs.mkdir(globalRoot, { recursive: true });
    await fs.mkdir(skillsRoot, { recursive: true });
    await fs.mkdir(path.join(repo, ".claude"), { recursive: true });
    await fs.mkdir(path.join(skillsRoot, "add-cli"), { recursive: true });
    await fs.mkdir(path.join(skillsRoot, "custom-review-app"), { recursive: true });
    await fs.writeFile(path.join(skillsRoot, "add-cli", "SKILL.md"), "---\nname: add-cli\n---\n# Add CLI\n");
    await fs.writeFile(
      path.join(skillsRoot, "custom-review-app", "SKILL.md"),
      "---\nname: custom-review-app\n---\n# Custom Review App\n",
    );
  });
  await writeFile(
    path.join(globalRoot, "projects.json"),
    JSON.stringify({ schemaVersion: 1, projects: {} }, null, 2),
  );
  await writeFile(
    path.join(globalRoot, "capabilities.json"),
    JSON.stringify({ schemaVersion: 1, capabilities: {} }, null, 2),
  );
  await writeFile(
    path.join(globalRoot, "managed-claude-section.md"),
    "<!-- appelent-managed:start -->\n## Managed Claude\n<!-- appelent-managed:end -->\n",
  );
  await writeFile(
    path.join(globalRoot, "managed-agents-section.md"),
    "<!-- appelent-managed:start -->\n## Managed Agents\n<!-- appelent-managed:end -->\n",
  );
  await writeFile(path.join(repo, "CLAUDE.md"), "# Project\n\nOld notes\n");
  await writeFile(path.join(repo, "AGENTS.md"), "# Agents\n\nOld notes\n");
  await writeFile(
    path.join(repo, "package.json"),
    JSON.stringify(
      {
        scripts: { "dev:watch": "x", "deploy:prod": "x", check: "x" },
        dependencies: { "@appelent/auth": "^0.1.0" },
      },
      null,
      2,
    ),
  );
  return {
    root,
    globalRoot,
    skillsRoot,
    repo,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("replaceManagedBlock appends a missing block and replaces an existing block", () => {
  const blockA = "<!-- appelent-managed:start -->\nA\n<!-- appelent-managed:end -->\n";
  const blockB = "<!-- appelent-managed:start -->\nB\n<!-- appelent-managed:end -->\n";
  const appended = replaceManagedBlock("# Title\n", blockA);
  assert.equal(appended, "# Title\n\n" + blockA);
  const replaced = replaceManagedBlock(appended, blockB);
  assert.equal(replaced, "# Title\n\n" + blockB);
});

test("registerProject and ensureCapability update sorted JSON", async () => {
  const fx = await makeFixture();
  try {
    await registerProject({
      globalRoot: fx.globalRoot,
      name: "workouts",
      repoPath: fx.repo,
      baseline: "tanstack-convex-clerk-cloudflare",
      capabilities: ["cli", "auth"],
    });
    await ensureCapability({
      globalRoot: fx.globalRoot,
      name: "cli",
      owner: "capability-skill",
      skill: "add-cli",
      packageName: "@appelent/cli",
      status: "candidate",
    });
    const projects = JSON.parse(await readFile(path.join(fx.globalRoot, "projects.json"), "utf8"));
    const capabilities = JSON.parse(await readFile(path.join(fx.globalRoot, "capabilities.json"), "utf8"));
    assert.deepEqual(projects.projects.workouts.capabilities, ["auth", "cli"]);
    assert.equal(capabilities.capabilities.cli.skill, "add-cli");
  } finally {
    await fx.cleanup();
  }
});

test("refreshManagedDocs inserts canonical blocks without removing existing notes", async () => {
  const fx = await makeFixture();
  try {
    await refreshManagedDocs({ globalRoot: fx.globalRoot, repoPath: fx.repo });
    const claude = await readFile(path.join(fx.repo, "CLAUDE.md"), "utf8");
    const agents = await readFile(path.join(fx.repo, "AGENTS.md"), "utf8");
    assert.match(claude, /# Project/);
    assert.match(claude, /## Managed Claude/);
    assert.match(agents, /# Agents/);
    assert.match(agents, /## Managed Agents/);
  } finally {
    await fx.cleanup();
  }
});

test("refreshMirror writes registry snapshots and selected skills", async () => {
  const fx = await makeFixture();
  try {
    await ensureCapability({
      globalRoot: fx.globalRoot,
      name: "cli",
      owner: "capability-skill",
      skill: "add-cli",
      packageName: "@appelent/cli",
      status: "candidate",
    });
    await refreshMirror({ globalRoot: fx.globalRoot, skillsRoot: fx.skillsRoot, repoPath: fx.repo });
    const mirroredProjects = await readFile(
      path.join(fx.repo, ".claude", "appelent", "projects.managed.json"),
      "utf8",
    );
    const mirroredSkill = await readFile(
      path.join(fx.repo, ".claude", "skills", "add-cli", "SKILL.md"),
      "utf8",
    );
    const reviewSkill = await readFile(
      path.join(fx.repo, ".claude", "skills", "review-app", "SKILL.md"),
      "utf8",
    );
    assert.match(mirroredProjects, /"schemaVersion": 1/);
    assert.match(mirroredSkill, /name: add-cli/);
    assert.match(reviewSkill, /name: review-app/);
  } finally {
    await fx.cleanup();
  }
});

test("auditProjects reports missing managed docs and capability evidence", async () => {
  const fx = await makeFixture();
  try {
    await registerProject({
      globalRoot: fx.globalRoot,
      name: "demo",
      repoPath: fx.repo,
      baseline: "tanstack-convex-clerk-cloudflare",
      capabilities: ["auth", "cli"],
    });
    const report = await auditProjects({ globalRoot: fx.globalRoot });
    const demo = report.projects.find((project) => project.name === "demo");
    assert.equal(demo.status, "drift");
    assert.ok(demo.issues.includes("CLAUDE.md missing managed block"));
    assert.ok(demo.issues.includes("AGENTS.md missing managed block"));
    assert.ok(demo.issues.includes("capability cli missing evidence: cli directory or test:cli script"));
  } finally {
    await fx.cleanup();
  }
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```powershell
node --test C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs
```

Expected: FAIL with an import error because `scripts\appelent-registry.mjs` does not exist.

---

### Task 3: Implement Registry Helper

**Files:**
- Create: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`
- Test: `C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs`

- [ ] **Step 1: Create scripts directory**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ericj\.claude\appelent\scripts | Select-Object FullName
```

Expected: output includes `C:\Users\ericj\.claude\appelent\scripts`.

- [ ] **Step 2: Write implementation**

Create `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs` with:

```js
#!/usr/bin/env node
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START = "<!-- appelent-managed:start -->";
const END = "<!-- appelent-managed:end -->";
const DEFAULT_BASELINE = "tanstack-convex-clerk-cloudflare";

function defaultGlobalRoot() {
  return path.join(homedir(), ".claude", "appelent");
}

function defaultSkillsRoot() {
  return path.join(homedir(), ".claude", "skills");
}

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function sortObjectByKey(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

export function replaceManagedBlock(content, block) {
  const normalizedBlock = block.endsWith("\n") ? block : `${block}\n`;
  const start = content.indexOf(START);
  const end = content.indexOf(END);
  if (start !== -1 && end !== -1 && end > start) {
    const afterEnd = end + END.length;
    const suffix = content.slice(afterEnd).replace(/^\r?\n/, "");
    return `${content.slice(0, start)}${normalizedBlock}${suffix}`;
  }
  const trimmed = content.replace(/\s+$/, "");
  return `${trimmed}\n\n${normalizedBlock}`;
}

export async function registerProject({
  globalRoot = defaultGlobalRoot(),
  name,
  repoPath,
  baseline = DEFAULT_BASELINE,
  capabilities = [],
}) {
  if (!name) throw new Error("registerProject requires name");
  if (!repoPath) throw new Error("registerProject requires repoPath");
  const filePath = path.join(globalRoot, "projects.json");
  const registry = await readJson(filePath, { schemaVersion: 1, projects: {} });
  const existing = registry.projects[name] ?? {};
  registry.schemaVersion = 1;
  registry.projects[name] = {
    ...existing,
    path: repoPath,
    baseline,
    capabilities: uniqueSorted([...(existing.capabilities ?? []), ...capabilities]),
  };
  registry.projects = sortObjectByKey(registry.projects);
  await writeJson(filePath, registry);
  return registry.projects[name];
}

export async function ensureCapability({
  globalRoot = defaultGlobalRoot(),
  name,
  owner,
  skill = undefined,
  packageName = undefined,
  status = "active",
}) {
  if (!name) throw new Error("ensureCapability requires name");
  if (!owner) throw new Error("ensureCapability requires owner");
  const filePath = path.join(globalRoot, "capabilities.json");
  const registry = await readJson(filePath, { schemaVersion: 1, capabilities: {} });
  registry.schemaVersion = 1;
  registry.capabilities[name] = {
    owner,
    ...(skill ? { skill } : {}),
    package: packageName === undefined ? null : packageName,
    status,
  };
  registry.capabilities = sortObjectByKey(registry.capabilities);
  await writeJson(filePath, registry);
  return registry.capabilities[name];
}

async function readRequired(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return readFile(filePath, "utf8");
}

export async function refreshManagedDocs({ globalRoot = defaultGlobalRoot(), repoPath }) {
  if (!repoPath) throw new Error("refreshManagedDocs requires repoPath");
  const claudeBlock = await readRequired(path.join(globalRoot, "managed-claude-section.md"));
  const agentsBlock = await readRequired(path.join(globalRoot, "managed-agents-section.md"));
  const claudePath = path.join(repoPath, "CLAUDE.md");
  const agentsPath = path.join(repoPath, "AGENTS.md");
  const claudeExisting = existsSync(claudePath) ? await readFile(claudePath, "utf8") : "# CLAUDE.md\n";
  const agentsExisting = existsSync(agentsPath) ? await readFile(agentsPath, "utf8") : "# AGENTS.md\n\nRead `CLAUDE.md` for project conventions.\n";
  await writeFile(claudePath, replaceManagedBlock(claudeExisting, claudeBlock));
  await writeFile(agentsPath, replaceManagedBlock(agentsExisting, agentsBlock));
}

async function copySkillIfPresent(skillsRoot, repoPath, skillName, targetName = skillName) {
  const source = path.join(skillsRoot, skillName);
  if (!existsSync(source)) return false;
  const target = path.join(repoPath, ".claude", "skills", targetName);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, force: true });
  const targetSkill = path.join(target, "SKILL.md");
  if (skillName === "custom-review-app" && existsSync(targetSkill)) {
    const content = await readFile(targetSkill, "utf8");
    await writeFile(targetSkill, content.replace("name: custom-review-app", "name: review-app").replace("# Custom Review App", "# Review App"));
  }
  if (skillName === "custom-review-session" && existsSync(targetSkill)) {
    const content = await readFile(targetSkill, "utf8");
    await writeFile(targetSkill, content.replace("name: custom-review-session", "name: review-session").replace("# Custom Review Session", "# Review Session"));
  }
  return true;
}

export async function refreshMirror({
  globalRoot = defaultGlobalRoot(),
  skillsRoot = defaultSkillsRoot(),
  repoPath,
}) {
  if (!repoPath) throw new Error("refreshMirror requires repoPath");
  const targetRoot = path.join(repoPath, ".claude", "appelent");
  await mkdir(targetRoot, { recursive: true });
  await cp(path.join(globalRoot, "projects.json"), path.join(targetRoot, "projects.managed.json"), { force: true });
  await cp(path.join(globalRoot, "capabilities.json"), path.join(targetRoot, "capabilities.managed.json"), { force: true });

  const capabilities = await readJson(path.join(globalRoot, "capabilities.json"), {
    schemaVersion: 1,
    capabilities: {},
  });
  const mirrored = [];
  for (const capability of Object.values(capabilities.capabilities)) {
    if (capability.owner === "capability-skill" && capability.skill) {
      if (await copySkillIfPresent(skillsRoot, repoPath, capability.skill)) {
        mirrored.push(capability.skill);
      }
    }
  }
  const reviewMirrors = [
    ["custom-review-app", "review-app"],
    ["custom-review-session", "review-session"],
  ];
  for (const [sourceSkill, targetSkill] of reviewMirrors) {
    if (await copySkillIfPresent(skillsRoot, repoPath, sourceSkill, targetSkill)) {
      mirrored.push(targetSkill);
    }
  }
  return uniqueSorted(mirrored);
}

async function pathIsDirectory(filePath) {
  try {
    return (await stat(filePath)).isDirectory();
  } catch {
    return false;
  }
}

function hasManagedBlock(content) {
  return content.includes(START) && content.includes(END);
}

async function readPackageJson(repoPath) {
  const filePath = path.join(repoPath, "package.json");
  if (!existsSync(filePath)) return {};
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function auditProject(name, project) {
  const issues = [];
  const repoPath = project.path;
  if (!(await pathIsDirectory(repoPath))) {
    return { name, status: "missing", issues: [`repo path does not exist: ${repoPath}`] };
  }

  const claudePath = path.join(repoPath, "CLAUDE.md");
  const agentsPath = path.join(repoPath, "AGENTS.md");
  const claude = existsSync(claudePath) ? await readFile(claudePath, "utf8") : "";
  const agents = existsSync(agentsPath) ? await readFile(agentsPath, "utf8") : "";
  if (!hasManagedBlock(claude)) issues.push("CLAUDE.md missing managed block");
  if (!hasManagedBlock(agents)) issues.push("AGENTS.md missing managed block");

  const packageJson = await readPackageJson(repoPath);
  const scripts = packageJson.scripts ?? {};
  for (const scriptName of ["dev:watch", "deploy:prod", "check"]) {
    if (!scripts[scriptName]) issues.push(`baseline script missing: ${scriptName}`);
  }

  const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  const capabilities = project.capabilities ?? [];
  if (capabilities.includes("auth") && !deps["@appelent/auth"]) {
    issues.push("capability auth missing evidence: @appelent/auth dependency");
  }
  if (capabilities.includes("cli")) {
    const hasCliDirectory = await pathIsDirectory(path.join(repoPath, "cli"));
    const hasCliScript = Boolean(scripts["test:cli"]);
    if (!hasCliDirectory && !hasCliScript) {
      issues.push("capability cli missing evidence: cli directory or test:cli script");
    }
  }

  const mirrorRoot = path.join(repoPath, ".claude", "appelent");
  if (!existsSync(path.join(mirrorRoot, "projects.managed.json"))) {
    issues.push("mirror missing: .claude/appelent/projects.managed.json");
  }
  if (!existsSync(path.join(mirrorRoot, "capabilities.managed.json"))) {
    issues.push("mirror missing: .claude/appelent/capabilities.managed.json");
  }

  return { name, status: issues.length === 0 ? "ok" : "drift", issues };
}

export async function auditProjects({ globalRoot = defaultGlobalRoot() } = {}) {
  const registry = await readJson(path.join(globalRoot, "projects.json"), {
    schemaVersion: 1,
    projects: {},
  });
  const projects = [];
  for (const [name, project] of Object.entries(registry.projects)) {
    projects.push(await auditProject(name, project));
  }
  return {
    status: projects.every((project) => project.status === "ok") ? "ok" : "drift",
    projects,
  };
}

function getArg(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function getAllArgs(args, name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

function printAudit(report) {
  for (const project of report.projects) {
    console.log(`${project.name}: ${project.status}`);
    for (const issue of project.issues) {
      console.log(`  - ${issue}`);
    }
  }
  console.log(`overall: ${report.status}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const globalRoot = getArg(args, "--global-root") ?? defaultGlobalRoot();
  const skillsRoot = getArg(args, "--skills-root") ?? defaultSkillsRoot();

  if (command === "register-project") {
    await registerProject({
      globalRoot,
      name: getArg(args, "--name"),
      repoPath: getArg(args, "--repo"),
      baseline: getArg(args, "--baseline") ?? DEFAULT_BASELINE,
      capabilities: getAllArgs(args, "--capability"),
    });
    return;
  }
  if (command === "ensure-capability") {
    await ensureCapability({
      globalRoot,
      name: getArg(args, "--name"),
      owner: getArg(args, "--owner"),
      skill: getArg(args, "--skill"),
      packageName: getArg(args, "--package"),
      status: getArg(args, "--status") ?? "active",
    });
    return;
  }
  if (command === "refresh-docs") {
    await refreshManagedDocs({ globalRoot, repoPath: getArg(args, "--repo") });
    return;
  }
  if (command === "refresh-mirror") {
    await refreshMirror({ globalRoot, skillsRoot, repoPath: getArg(args, "--repo") });
    return;
  }
  if (command === "audit") {
    const report = await auditProjects({ globalRoot });
    if (args.includes("--json")) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printAudit(report);
    }
    process.exitCode = report.status === "ok" ? 0 : 1;
    return;
  }
  throw new Error(`Unknown command: ${command ?? "(missing)"}`);
}

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
node --test C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs
```

Expected: PASS with five passing tests.

- [ ] **Step 4: Run helper against current registry**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit --json
```

Expected: command exits non-zero if repos are not yet mirrored or marker blocks are missing. This is acceptable at this stage. The JSON output must parse and list the projects from `projects.json`.

- [ ] **Step 5: Commit if global config is git-tracked**

If `C:\Users\ericj\.claude` is a git repo, run:

```powershell
git add appelent\scripts\appelent-registry.mjs appelent\tests\appelent-registry.test.mjs
git commit -m "chore: add appelent registry helper"
```

If it is not a git repo, record in the implementation summary: `Global registry helper is not committed because global Claude config is not git-tracked.`

---

### Task 4: Add Audit Skill and Command

**Files:**
- Create: `C:\Users\ericj\.claude\skills\audit-appelent-projects\SKILL.md`
- Create: `C:\Users\ericj\.claude\commands\audit-appelent-projects.md`
- Test: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`

- [ ] **Step 1: Create audit skill folder**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ericj\.claude\skills\audit-appelent-projects | Select-Object FullName
```

Expected: output includes `C:\Users\ericj\.claude\skills\audit-appelent-projects`.

- [ ] **Step 2: Write audit skill**

Create `C:\Users\ericj\.claude\skills\audit-appelent-projects\SKILL.md` with:

```md
---
name: audit-appelent-projects
description: Use when checking which Appelent projects follow the managed baseline, whether CLAUDE.md/AGENTS.md marker blocks and repo-local mirrors are current, or whether registered capabilities match repo evidence.
---

# Audit Appelent Projects

Run a read-only audit of the Appelent managed-project registry and report drift.

## Source of Truth

- Canonical registry: `C:\Users\ericj\.claude\appelent\projects.json`
- Canonical capability catalog: `C:\Users\ericj\.claude\appelent\capabilities.json`
- Helper script: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`

## Audit Command

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Use JSON output when another agent or script needs structured data:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit --json
```

## How to Respond

Report results grouped by project:

- `ok`: no action needed.
- `drift`: explain each issue and recommend a fix.
- `missing`: the registry points at a path that does not exist.

The audit is read-only. Do not apply fixes silently.

## Common Fix Recommendations

- Missing marker blocks: rerun `custom-bootstrap` for that repo, or run the registry helper's `refresh-docs` command for that repo.
- Missing mirror files: rerun `custom-bootstrap`, or run the registry helper's `refresh-mirror` command for that repo.
- Registry says `auth` but dependency is missing: either add `@appelent/auth` through bootstrap, or remove the stale capability from `projects.json` if the project should not use shared auth.
- Registry says `cli` but no CLI evidence exists: run the future `add-cli` capability skill, or remove the stale capability from `projects.json`.
- Repo shows reusable functionality not in the registry: propose whether it belongs in an `@appelent/*` package, `custom-bootstrap`, or a capability skill before editing.

## Safety

Treat repo-local `.claude\appelent` files as mirrors. If global files and repo-local mirrors differ on the local machine, prefer global. In browser/web environments, use the repo-local mirror and flag the drift.
```

- [ ] **Step 3: Write command launcher**

Create `C:\Users\ericj\.claude\commands\audit-appelent-projects.md` with:

```md
---
description: Audit all registered Appelent managed projects for baseline, capability, docs, and mirror drift
argument-hint: [--json]
allowed-tools: Bash(node:*), Bash(powershell:*), Bash(Get-Content:*)
---

Invoke the `audit-appelent-projects` skill and run the Appelent registry audit.

If `$ARGUMENTS` includes `--json`, run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit --json
```

Otherwise run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Summarize every project with `ok`, `drift`, or `missing`. Do not apply fixes without an explicit follow-up request.
```

- [ ] **Step 4: Verify audit command path**

Run:

```powershell
Get-Content C:\Users\ericj\.claude\skills\audit-appelent-projects\SKILL.md
Get-Content C:\Users\ericj\.claude\commands\audit-appelent-projects.md
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Expected:

- Both files print.
- Audit prints a report.
- Audit may exit non-zero because mirrors and docs are not yet refreshed.

- [ ] **Step 5: Commit if global config is git-tracked**

If `C:\Users\ericj\.claude` is a git repo, run:

```powershell
git add skills\audit-appelent-projects\SKILL.md commands\audit-appelent-projects.md
git commit -m "chore: add appelent project audit skill"
```

---

### Task 5: Update Custom Bootstrap Instructions

**Files:**
- Modify: `C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md`
- Test: `C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs`

- [ ] **Step 1: Read current custom-bootstrap skill**

Run:

```powershell
Get-Content C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md
```

Expected: the skill includes numbered bootstrap sections and a wrap-up section.

- [ ] **Step 2: Insert Appelent managed registry step before wrap-up**

In `C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md`, add this section before the existing wrap-up section:

```md
### Appelent managed-project registry and web mirror

Register this app in the global Appelent managed-project control plane and refresh the repo-local mirror used by browser/web agents.

Canonical files:

- `C:\Users\ericj\.claude\appelent\projects.json`
- `C:\Users\ericj\.claude\appelent\capabilities.json`
- `C:\Users\ericj\.claude\appelent\managed-claude-section.md`
- `C:\Users\ericj\.claude\appelent\managed-agents-section.md`

Helper script:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs
```

For the current repo:

1. Derive the project name from `package.json`'s `name` when present; otherwise use the repo folder name.
2. Register the repo:
   ```powershell
   node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs register-project --name <project-name> --repo <absolute-repo-path> --baseline tanstack-convex-clerk-cloudflare
   ```
3. If the repo uses `@appelent/auth`, include `--capability auth`.
4. If the repo has a `cli/` folder or `test:cli` script, include `--capability cli`.
5. Refresh managed docs:
   ```powershell
   node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs refresh-docs --repo <absolute-repo-path>
   ```
6. Refresh the committed web mirror:
   ```powershell
   node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs refresh-mirror --repo <absolute-repo-path>
   ```
7. Run a read-only audit:
   ```powershell
   node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
   ```

The mirror files are committed repo tooling:

- `.claude/appelent/projects.managed.json`
- `.claude/appelent/capabilities.managed.json`
- selected mirrored skills under `.claude/skills`

If a browser/web agent changes a mirrored skill for a reusable, non-project-specific reason, port that change back to the global skill under `C:\Users\ericj\.claude\skills` before refreshing mirrors again.
```

- [ ] **Step 3: Add registry status to wrap-up summary**

In the existing wrap-up summary list in `custom-bootstrap`, add:

```md
- Appelent managed-project registry status: project registered, capabilities recorded, managed `CLAUDE.md`/`AGENTS.md` blocks refreshed, repo-local `.claude/appelent` mirror refreshed, and any audit drift reported.
```

- [ ] **Step 4: Verify the skill mentions registry and mirror**

Run:

```powershell
rg -n "managed-project registry|refresh-mirror|projects.managed.json|capabilities.managed.json" C:\Users\ericj\.claude\skills\custom-bootstrap\SKILL.md
```

Expected: all four phrases are found.

- [ ] **Step 5: Commit if global config is git-tracked**

If `C:\Users\ericj\.claude` is a git repo, run:

```powershell
git add skills\custom-bootstrap\SKILL.md
git commit -m "chore: register managed projects during bootstrap"
```

---

### Task 6: Refresh One Repo as a Smoke Test

**Files:**
- Modify: `D:\Dev\workouts\CLAUDE.md`
- Modify: `D:\Dev\workouts\AGENTS.md`
- Create or modify: `D:\Dev\workouts\.claude\appelent\projects.managed.json`
- Create or modify: `D:\Dev\workouts\.claude\appelent\capabilities.managed.json`
- Create or modify: `D:\Dev\workouts\.claude\skills\add-cli\SKILL.md` if global `add-cli` exists
- Create or modify: `D:\Dev\workouts\.claude\skills\review-app\SKILL.md`
- Create or modify: `D:\Dev\workouts\.claude\skills\review-session\SKILL.md`

- [ ] **Step 1: Check current repo status**

Run:

```powershell
git status --short
```

from:

```text
D:\Dev\workouts
```

Expected: note any existing user changes. Do not overwrite unrelated work.

- [ ] **Step 2: Register workouts with known capabilities**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs register-project --name workouts --repo D:\Dev\workouts --baseline tanstack-convex-clerk-cloudflare --capability auth --capability cli
```

Expected: command exits 0.

- [ ] **Step 3: Refresh managed docs**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs refresh-docs --repo D:\Dev\workouts
```

Expected: command exits 0.

- [ ] **Step 4: Refresh mirror**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs refresh-mirror --repo D:\Dev\workouts
```

Expected: command exits 0 and creates `.claude\appelent`.

- [ ] **Step 5: Inspect changed files**

Run:

```powershell
git diff -- CLAUDE.md AGENTS.md .claude
```

from:

```text
D:\Dev\workouts
```

Expected:

- `CLAUDE.md` contains the Appelent managed block and preserves existing project documentation.
- `AGENTS.md` contains the Appelent managed block and preserves existing project documentation.
- `.claude\appelent\projects.managed.json` exists.
- `.claude\appelent\capabilities.managed.json` exists.
- Mirrored skills exist only for available global skills.

- [ ] **Step 6: Run audit**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Expected: `workouts` should not report missing managed docs or missing mirror files. Other repos may still report drift.

- [ ] **Step 7: Run repo checks if changes are cleanly scoped**

Run:

```powershell
pnpm run check
```

from:

```text
D:\Dev\workouts
```

Expected: PASS, or the same pre-existing unrelated failure already known in the repo. If the command fails because the sandbox cannot run it, rerun with approved escalation according to the current Codex permission policy.

- [ ] **Step 8: Commit workouts mirror changes if appropriate**

If the diff only contains the managed marker blocks and `.claude` mirror files, run from `D:\Dev\workouts`:

```powershell
git add CLAUDE.md AGENTS.md .claude\appelent .claude\skills
git commit -m "chore: add appelent managed project mirror"
```

If there are unrelated user changes, do not commit them. Report the exact files that need user review.

---

### Task 7: Audit the Fleet and Report Follow-Up Work

**Files:**
- Read: `C:\Users\ericj\.claude\appelent\projects.json`
- Read: `C:\Users\ericj\.claude\appelent\capabilities.json`
- Read: registered project files under `D:\Dev`

- [ ] **Step 1: Run full audit**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit --json
```

Expected: JSON report with `status` and `projects`.

- [ ] **Step 2: Run human-readable audit**

Run:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Expected: project-by-project report.

- [ ] **Step 3: Summarize drift**

Prepare a summary with this shape:

```text
Appelent managed project audit

ok:
- workouts

drift:
- games: missing managed docs, missing mirror
- roadmaps: missing managed docs, missing mirror

missing:
- none

recommended next actions:
- Run custom-bootstrap on games, roadmaps, satisfactory, golf-app, gather.
- Confirm whether gather should use @appelent/auth before registering auth capability.
```

Use the actual audit output, not the example project names above if the output differs.

- [ ] **Step 4: Commit global changes if possible**

If `C:\Users\ericj\.claude` is git-tracked and has uncommitted changes, run:

```powershell
git status --short
git add appelent skills\audit-appelent-projects commands\audit-appelent-projects.md skills\custom-bootstrap\SKILL.md
git commit -m "chore: add appelent managed project tooling"
```

If it is not git-tracked, include this exact sentence in the final implementation summary:

```text
Global Claude config is not git-tracked, so the canonical registry and helper were updated in place without a commit.
```

---

## Final Verification

- [ ] Run registry tests:

```powershell
node --test C:\Users\ericj\.claude\appelent\tests\appelent-registry.test.mjs
```

Expected: PASS.

- [ ] Run audit:

```powershell
node C:\Users\ericj\.claude\appelent\scripts\appelent-registry.mjs audit
```

Expected: prints a report. It may exit non-zero if not every repo has been refreshed yet.

- [ ] If `D:\Dev\workouts` was used as the smoke test, run:

```powershell
git status --short
pnpm run check
```

Expected: no uncommitted smoke-test changes after commit, and check passes or reports a known pre-existing failure.

## Handoff Notes

- The first implementation creates real global files under `C:\Users\ericj\.claude`; this may require filesystem approval in sandboxed environments.
- `audit-appelent-projects` is read-only by design.
- `custom-bootstrap` becomes the write path that keeps registry, managed docs, and web mirrors current.
- Capability skills must call `ensure-capability`, `register-project`, `refresh-docs`, and `refresh-mirror` as part of their done criteria.
