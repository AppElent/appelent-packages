import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { validateCatalog } from "../scripts/validate-catalog.mjs";

function makeRepo() {
	const root = mkdtempSync(join(tmpdir(), "appelent-feature-"));
	mkdirSync(join(root, "skills", "appelent-feature"), { recursive: true });
	writeFileSync(
		join(root, "skills", "appelent-feature", "SKILL.md"),
		"---\nname: appelent-feature\ndescription: front door\n---\n# appelent-feature\n",
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

test("plugin utility skills (appelent-project, review-app, review-session, upgrade-deps) are excluded from the FEATURE.md contract", () => {
	const root = makeRepo();
	writeFeature(root, "mcp");
	for (const name of ["appelent-project", "review-app", "review-session", "upgrade-deps"]) {
		const dir = join(root, "skills", name);
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "SKILL.md"),
			`---\nname: ${name}\ndescription: use when x\n---\n# ${name}\n`,
		);
	}
	assert.deepEqual(validateCatalog(root), []);
	rmSync(root, { recursive: true, force: true });
});
