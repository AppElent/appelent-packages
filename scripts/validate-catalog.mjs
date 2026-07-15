import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_SECTIONS = [
	"What",
	"Stack",
	"Architecture",
	"Configuration",
	"Changelog",
];

// Skills that are deliberately not catalog features, and so are exempt from the
// FEATURE.md contract. This is the single source of truth: it can't be derived
// from FEATURE.md's presence, because a feature that simply forgot its
// FEATURE.md must still be an error rather than a silent skip. Tests import
// this, and validateExcludedProse below keeps appelent-feature's prose copy of
// the list honest.
export const EXCLUDED = new Set([
	"appelent-feature",
	"appelent-project",
	"review-app",
	"review-session",
	"upgrade-deps",
]);

const FRONT_DOOR_SKILL = join("skills", "appelent-feature", "SKILL.md");

// appelent-feature tells the agent which sibling folders are features by naming
// the exclusions in prose. Prose can't import the set above, so lint it instead:
// adding a utility skill here without updating that sentence makes the agent
// treat it as a feature.
function validateExcludedProse(root) {
	const path = join(root, FRONT_DOOR_SKILL);
	if (!existsSync(path)) return [`${FRONT_DOOR_SKILL} missing`];
	const text = readFileSync(path, "utf8");
	return [...EXCLUDED]
		.filter(
			(name) => name !== "appelent-feature" && !text.includes(`\`${name}\``),
		)
		.map(
			(name) =>
				`${FRONT_DOOR_SKILL} does not mention \`${name}\` — every EXCLUDED skill must be named in its "not a feature" list`,
		);
}

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

const SELF_IMPROVEMENT_DOC = join(
	"skills",
	"appelent-feature",
	"references",
	"self-improvement.md",
);

// Every skill must end by reflecting on itself and offering to file what was
// unclear back to the catalog. Pointer-only check: this lints against
// forgetting, it does not grade the prose.
function validateSelfImprovement(root, skillsDir) {
	const errors = [];
	if (!existsSync(join(root, SELF_IMPROVEMENT_DOC))) {
		errors.push(
			`${SELF_IMPROVEMENT_DOC} missing — every SKILL.md points at it`,
		);
	}
	for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const skillPath = join(skillsDir, entry.name, "SKILL.md");
		if (!existsSync(skillPath)) continue;
		if (!readFileSync(skillPath, "utf8").includes("self-improvement.md")) {
			errors.push(
				`${entry.name}: SKILL.md does not reference self-improvement.md — add a "## Self-improvement" section pointing at ${SELF_IMPROVEMENT_DOC}`,
			);
		}
	}
	return errors;
}

export function validateCatalog(root) {
	const skillsDir = join(root, "skills");
	const errors = [
		...validateSelfImprovement(root, skillsDir),
		...validateExcludedProse(root),
	];
	const features = readdirSync(skillsDir, { withFileTypes: true })
		.filter((e) => e.isDirectory() && !EXCLUDED.has(e.name))
		.map((e) => e.name);

	for (const name of features) {
		const dir = join(skillsDir, name);

		const skillPath = join(dir, "SKILL.md");
		const skillFm = existsSync(skillPath)
			? parseFrontmatter(readFileSync(skillPath, "utf8"))
			: null;
		if (!skillFm?.name || !skillFm?.description) {
			errors.push(
				`${name}: SKILL.md missing or lacks name/description frontmatter`,
			);
		}

		const featurePath = join(dir, "FEATURE.md");
		if (!existsSync(featurePath)) {
			errors.push(`${name}: FEATURE.md missing`);
			continue;
		}
		const text = readFileSync(featurePath, "utf8");
		const fm = parseFrontmatter(text) ?? {};
		if (fm.name !== name) {
			errors.push(
				`${name}: FEATURE.md frontmatter name "${fm.name}" does not match folder`,
			);
		}
		if (!/^[1-9]\d*$/.test(fm.version ?? "")) {
			errors.push(
				`${name}: FEATURE.md version "${fm.version}" is not a positive integer`,
			);
		}
		for (const section of REQUIRED_SECTIONS) {
			if (!new RegExp(`^## ${section}\\s*$`, "m").test(text)) {
				errors.push(
					`${name}: FEATURE.md missing required section "## ${section}"`,
				);
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

if (
	process.argv[1] &&
	import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))
) {
	const errors = validateCatalog(process.cwd());
	for (const e of errors) console.error(`ERROR: ${e}`);
	console.log(errors.length === 0 ? "catalog ok" : `${errors.length} error(s)`);
	process.exit(errors.length === 0 ? 0 : 1);
}
