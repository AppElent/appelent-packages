import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	validatePluginManifests,
	validateVersionBump,
} from "../scripts/validate-plugin-manifests.mjs";

function makeRepo({ claudeManifest, codexManifest } = {}) {
	const root = mkdtempSync(join(tmpdir(), "appelent-plugin-"));
	mkdirSync(join(root, ".claude-plugin"), { recursive: true });
	mkdirSync(join(root, ".codex-plugin"), { recursive: true });
	mkdirSync(join(root, "skills"), { recursive: true });
	writeFileSync(
		join(root, ".claude-plugin", "plugin.json"),
		JSON.stringify(claudeManifest ?? baseClaudeManifest(), null, 2),
	);
	if (codexManifest !== null) {
		writeFileSync(
			join(root, ".codex-plugin", "plugin.json"),
			JSON.stringify(codexManifest ?? baseCodexManifest(), null, 2),
		);
	}
	return root;
}

function baseClaudeManifest() {
	return {
		name: "appelent",
		description: "Appelent feature catalog",
		version: "0.1.2",
		author: { name: "AppElent" },
		repository: "https://github.com/AppElent/appelent-packages",
		keywords: ["appelent", "features"],
	};
}

function baseCodexManifest(overrides = {}) {
	return {
		name: "appelent",
		description: "Appelent feature catalog",
		version: "0.1.2",
		author: { name: "AppElent" },
		repository: "https://github.com/AppElent/appelent-packages",
		keywords: ["appelent", "features"],
		skills: "./skills/",
		interface: {
			displayName: "Appelent",
			shortDescription: "Use the Appelent feature catalog in Codex.",
			longDescription: "Appelent packages shared app features as Codex skills.",
			developerName: "AppElent",
			category: "Productivity",
			capabilities: ["Skills"],
			defaultPrompt: "Apply an Appelent feature.",
		},
		...overrides,
	};
}

test("matching Claude and Codex manifests pass", () => {
	const root = makeRepo();
	assert.deepEqual(validatePluginManifests(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("missing Codex manifest is reported", () => {
	const root = makeRepo({ codexManifest: null });
	const errors = validatePluginManifests(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /missing.*\.codex-plugin.*plugin\.json/);
	rmSync(root, { recursive: true, force: true });
});

test("mismatched versions fail", () => {
	const root = makeRepo({
		codexManifest: baseCodexManifest({ version: "0.1.3" }),
	});
	const errors = validatePluginManifests(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /version.*Claude.*0\.1\.2.*Codex.*0\.1\.3/);
	rmSync(root, { recursive: true, force: true });
});

test("wrong Codex skills path fails", () => {
	const root = makeRepo({
		codexManifest: baseCodexManifest({ skills: "./other/" }),
	});
	const errors = validatePluginManifests(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /skills.*\.\/skills\//);
	rmSync(root, { recursive: true, force: true });
});

test("unsupported Codex manifest fields fail", () => {
	const root = makeRepo({
		codexManifest: baseCodexManifest({ hooks: "./hooks.json" }),
	});
	const errors = validatePluginManifests(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /unsupported.*hooks/);
	rmSync(root, { recursive: true, force: true });
});

function makeGitRepo() {
	const root = mkdtempSync(join(tmpdir(), "appelent-bump-"));
	const run = (args) =>
		execFileSync("git", args, { cwd: root, stdio: "ignore" });
	run(["init", "-b", "main"]);
	run(["config", "user.email", "test@example.com"]);
	run(["config", "user.name", "test"]);
	mkdirSync(join(root, ".claude-plugin"), { recursive: true });
	mkdirSync(join(root, "skills", "mcp"), { recursive: true });
	writeFileSync(
		join(root, ".claude-plugin", "plugin.json"),
		JSON.stringify({ name: "appelent", version: "0.1.0" }),
	);
	writeFileSync(join(root, "skills", "mcp", "SKILL.md"), "# mcp\n");
	run(["add", "-A"]);
	run(["commit", "-m", "init"]);
	return { root, run };
}

function setVersion(root, version) {
	const path = join(root, ".claude-plugin", "plugin.json");
	const json = JSON.parse(readFileSync(path, "utf8"));
	json.version = version;
	writeFileSync(path, JSON.stringify(json));
}

test("a skills/ change without a version bump is reported", () => {
	const { root } = makeGitRepo();
	writeFileSync(join(root, "skills", "mcp", "SKILL.md"), "# mcp\nchanged\n");

	const errors = validateVersionBump(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /version still "0\.1\.0"/);
	assert.match(errors[0], /skills\/mcp\/SKILL\.md/);
	rmSync(root, { recursive: true, force: true });
});

test("the same change passes once the version is bumped", () => {
	const { root } = makeGitRepo();
	writeFileSync(join(root, "skills", "mcp", "SKILL.md"), "# mcp\nchanged\n");
	setVersion(root, "0.1.1");

	assert.deepEqual(validateVersionBump(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("it fires on committed work too, not just the working tree", () => {
	const { root, run } = makeGitRepo();
	run(["checkout", "-b", "feature"]);
	writeFileSync(join(root, "skills", "mcp", "SKILL.md"), "# mcp\nchanged\n");
	run(["add", "-A"]);
	run(["commit", "-m", "skill change, no bump"]);

	assert.match(validateVersionBump(root)[0], /bump both plugin manifests/);
	rmSync(root, { recursive: true, force: true });
});

test("changes outside skills/ and commands/ do not require a bump", () => {
	const { root } = makeGitRepo();
	writeFileSync(join(root, "README.md"), "docs only\n");

	assert.deepEqual(validateVersionBump(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("a non-git directory is skipped rather than failed", () => {
	const root = mkdtempSync(join(tmpdir(), "appelent-nogit-"));
	assert.deepEqual(validateVersionBump(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("a brand-new untracked skill still requires a bump (capture validates before staging)", () => {
	const { root } = makeGitRepo();
	mkdirSync(join(root, "skills", "brandnew"), { recursive: true });
	writeFileSync(join(root, "skills", "brandnew", "SKILL.md"), "# brandnew\n");

	const errors = validateVersionBump(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /skills\/brandnew\/SKILL\.md/);
	rmSync(root, { recursive: true, force: true });
});

test("untracked files respect .gitignore", () => {
	const { root, run } = makeGitRepo();
	writeFileSync(join(root, ".gitignore"), "skills/scratch/\n");
	run(["add", "-A"]);
	run(["commit", "-m", "ignore scratch"]);
	mkdirSync(join(root, "skills", "scratch"), { recursive: true });
	writeFileSync(join(root, "skills", "scratch", "SKILL.md"), "# scratch\n");

	assert.deepEqual(validateVersionBump(root), []);
	rmSync(root, { recursive: true, force: true });
});
