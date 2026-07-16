import { strict as assert } from "node:assert";
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
import { EXCLUDED, validateCatalog } from "../scripts/validate-catalog.mjs";

const POINTER =
	"\n## Self-improvement\n\nFollow `../appelent-feature/references/self-improvement.md`.\n";

function makeRepo() {
	const root = mkdtempSync(join(tmpdir(), "appelent-feature-"));
	mkdirSync(join(root, "skills", "appelent-feature", "references"), {
		recursive: true,
	});
	writeFileSync(
		join(
			root,
			"skills",
			"appelent-feature",
			"references",
			"self-improvement.md",
		),
		"# Self-improvement reflection\n",
	);
	const notFeatures = [...EXCLUDED].map((n) => `\`${n}\``).join(", ");
	writeFileSync(
		join(root, "skills", "appelent-feature", "SKILL.md"),
		`---\nname: appelent-feature\ndescription: front door\n---\n# appelent-feature\n\nEvery directory that is not ${notFeatures} is a feature.\n${POINTER}`,
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
		skillMd ??
			`---\nname: ${name}\ndescription: use when x\n---\n# ${name}\n${POINTER}`,
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
	writeFeature(root, "mcp", { skillMd: `# mcp\nno frontmatter\n${POINTER}` });
	const errors = validateCatalog(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /mcp.*SKILL\.md/);
	rmSync(root, { recursive: true, force: true });
});

test("plugin utility skills (appelent-project, review-app, review-session, upgrade-deps) are excluded from the FEATURE.md contract", () => {
	const root = makeRepo();
	writeFeature(root, "mcp");
	for (const name of [...EXCLUDED].filter((n) => n !== "appelent-feature")) {
		const dir = join(root, "skills", name);
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "SKILL.md"),
			`---\nname: ${name}\ndescription: use when x\n---\n# ${name}\n${POINTER}`,
		);
	}
	assert.deepEqual(validateCatalog(root), []);
	rmSync(root, { recursive: true, force: true });
});

test("baseline treats plugin workflow skills as primary, not copied project defaults", () => {
	const root = process.cwd();
	const baseline = readFileSync(
		join(root, "skills", "baseline", "SKILL.md"),
		"utf8",
	);
	const project = readFileSync(
		join(root, "skills", "appelent-project", "SKILL.md"),
		"utf8",
	);
	const readme = readFileSync(join(root, "README.md"), "utf8");

	assert.doesNotMatch(
		baseline,
		/sync-skills review-app review-session upgrade-deps/,
	);
	assert.doesNotMatch(baseline, /project-local copies/);
	assert.doesNotMatch(baseline, /\.claude\/skills\/upgrade-deps\/SKILL\.md/);
	assert.match(
		baseline,
		/Use the plugin-provided `review-app`,\s+`review-session`, and `upgrade-deps`\s+skills directly/,
	);
	assert.match(project, /fallback-only/);
	assert.doesNotMatch(readme, /meant to be copied into an app/);
});

test("review workflow skills create GitHub issues instead of markdown review-note files", () => {
	const root = process.cwd();
	for (const name of ["review-app", "review-session"]) {
		const skill = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");

		assert.match(skill, /gh repo view --json nameWithOwner -q \.nameWithOwner/);
		assert.match(skill, /gh issue create/);
		assert.match(skill, /single GitHub issue|one GitHub issue/i);
		assert.doesNotMatch(skill, /docs\/review-notes/);
		assert.doesNotMatch(skill, /review-YYYY-MM-DD-HHMM/);
		assert.doesNotMatch(skill, /auto-review-YYYY-MM-DD-HHMM/);
		assert.doesNotMatch(
			skill,
			/Claude Code's \*\*Goals\*\* feature|Goals feature/,
		);
	}
});

test("baseline includes an app-local GitHub issue reporter scaffold", () => {
	const root = process.cwd();
	const feature = readFileSync(
		join(root, "skills", "baseline", "FEATURE.md"),
		"utf8",
	);
	const skill = readFileSync(
		join(root, "skills", "baseline", "SKILL.md"),
		"utf8",
	);

	assert.match(feature, /^version: 5$/m);
	assert.match(feature, /GitHub issue reporter/);
	assert.match(skill, /\/api\/github\/issues/);
	assert.match(skill, /GITHUB_ISSUES_TOKEN/);
	assert.match(skill, /window\.location\.href/);
	assert.match(skill, /logged-in user identity/);
	assert.match(skill, /Request shape/);
	assert.match(skill, /Response shape/);
	assert.match(skill, /fetch\("\/api\/github\/issues"/);
	assert.match(skill, /No model call is part of v1/);
});

test("every skill must reference the self-improvement reflection, excluded ones included", () => {
	const root = makeRepo();
	writeFeature(root, "mcp", {
		skillMd: "---\nname: mcp\ndescription: use when x\n---\n# mcp\n",
	});
	const dir = join(root, "skills", "upgrade-deps");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, "SKILL.md"),
		"---\nname: upgrade-deps\ndescription: use when x\n---\n# upgrade-deps\n",
	);

	const errors = validateCatalog(root);
	assert.equal(errors.length, 2);
	assert.match(
		errors.join("\n"),
		/mcp: SKILL\.md does not reference self-improvement\.md/,
	);
	assert.match(
		errors.join("\n"),
		/upgrade-deps: SKILL\.md does not reference self-improvement\.md/,
	);
	rmSync(root, { recursive: true, force: true });
});

test("a missing self-improvement reference doc is reported", () => {
	const root = makeRepo();
	writeFeature(root, "mcp");
	rmSync(
		join(
			root,
			"skills",
			"appelent-feature",
			"references",
			"self-improvement.md",
		),
	);
	const errors = validateCatalog(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /self-improvement\.md missing/);
	rmSync(root, { recursive: true, force: true });
});

test("the self-improvement reflection states the always-catalog override and dedupe search", () => {
	const root = process.cwd();
	const doc = readFileSync(
		join(
			root,
			"skills",
			"appelent-feature",
			"references",
			"self-improvement.md",
		),
		"utf8",
	);

	// Skill feedback must never land in an app's backlog, whichever front door ran.
	assert.match(doc, /always.*catalog/i);
	assert.match(doc, /AppElent\/appelent-packages/);
	// Fires on every run, so recurring friction must not refile every time.
	assert.match(
		doc,
		/gh issue list --repo AppElent\/appelent-packages --state open --search/,
	);
	// Never file without asking; silence is the normal outcome.
	assert.match(doc, /Ask before filing/);
	assert.match(doc, /Nothing noteworthy is the normal outcome/);
});

test("appelent-project's reflection points at the catalog, not the app repo it files issues against", () => {
	const root = process.cwd();
	const project = readFileSync(
		join(root, "skills", "appelent-project", "SKILL.md"),
		"utf8",
	);
	assert.match(project, /## Self-improvement/);
	assert.match(project, /not.*this app's repo/i);
});

test("feature skills guard against double-reflecting when reached via apply", () => {
	const root = process.cwd();
	for (const name of ["auth", "baseline", "cli", "i18n", "mcp"]) {
		const skill = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
		assert.match(
			skill,
			new RegExp(`/appelent:feature apply ${name}\``),
			`${name}: missing the apply double-reflection guard`,
		);
	}
	const apply = readFileSync(
		join(root, "skills", "appelent-feature", "SKILL.md"),
		"utf8",
	);
	assert.match(apply, /don't\s+reflect twice/);
});

test("appelent-feature's prose must name every EXCLUDED skill, so the two lists can't drift", () => {
	const root = makeRepo();
	writeFeature(root, "mcp");
	const skillPath = join(root, "skills", "appelent-feature", "SKILL.md");
	writeFileSync(
		skillPath,
		readFileSync(skillPath, "utf8").replace("`upgrade-deps`", "upgrade-deps"),
	);

	const errors = validateCatalog(root);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /does not mention `upgrade-deps`/);
	rmSync(root, { recursive: true, force: true });
});

test("the real appelent-feature prose names every EXCLUDED skill", () => {
	assert.deepEqual(validateCatalog(process.cwd()), []);
});
