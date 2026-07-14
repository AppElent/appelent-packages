import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { validatePluginManifests } from "../scripts/validate-plugin-manifests.mjs";

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
