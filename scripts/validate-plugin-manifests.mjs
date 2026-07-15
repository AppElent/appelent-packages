import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BUMP_TRIGGERS = ["skills/", "commands/"];
const BASE_REF_CANDIDATES = ["origin/main", "origin/master", "main", "master"];

const SHARED_FIELDS = ["name", "version", "description", "repository"];
const ALLOWED_CODEX_FIELDS = new Set([
	"id",
	"name",
	"version",
	"description",
	"skills",
	"apps",
	"mcpServers",
	"interface",
	"author",
	"homepage",
	"repository",
	"license",
	"keywords",
]);
const SEMVER =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

function readJson(path, label, errors) {
	if (!existsSync(path)) {
		errors.push(`missing ${label}`);
		return null;
	}
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		errors.push(`${label} must be valid JSON: ${error.message}`);
		return null;
	}
}

function sameJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function requireString(manifest, field, label, errors) {
	if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
		errors.push(`${label} field "${field}" must be a non-empty string`);
	}
}

function validateCodexShape(root, codex, errors) {
	for (const field of Object.keys(codex)) {
		if (!ALLOWED_CODEX_FIELDS.has(field)) {
			errors.push(`unsupported Codex manifest field "${field}"`);
		}
	}

	for (const field of ["name", "version", "description", "skills"]) {
		requireString(codex, field, "Codex manifest", errors);
	}

	if (typeof codex.version === "string" && !SEMVER.test(codex.version)) {
		errors.push(
			`Codex manifest version "${codex.version}" must be strict semver`,
		);
	}

	if (codex.skills !== "./skills/") {
		errors.push('Codex manifest field "skills" must be "./skills/"');
	} else if (!existsSync(join(root, "skills"))) {
		errors.push(
			'Codex manifest field "skills" points at missing directory "skills"',
		);
	}

	if (!codex.author || typeof codex.author !== "object") {
		errors.push('Codex manifest field "author" must be an object');
	} else if (
		typeof codex.author.name !== "string" ||
		codex.author.name.trim() === ""
	) {
		errors.push(
			'Codex manifest field "author.name" must be a non-empty string',
		);
	}

	if (!codex.interface || typeof codex.interface !== "object") {
		errors.push('Codex manifest field "interface" must be an object');
		return;
	}

	for (const field of [
		"displayName",
		"shortDescription",
		"longDescription",
		"developerName",
		"category",
	]) {
		if (
			typeof codex.interface[field] !== "string" ||
			codex.interface[field].trim() === ""
		) {
			errors.push(
				`Codex manifest field "interface.${field}" must be a non-empty string`,
			);
		}
	}
	if (
		!Array.isArray(codex.interface.capabilities) ||
		!codex.interface.capabilities.every(
			(value) => typeof value === "string" && value.trim(),
		)
	) {
		errors.push(
			'Codex manifest field "interface.capabilities" must be an array of strings',
		);
	}
	if (
		typeof codex.interface.defaultPrompt !== "string" ||
		codex.interface.defaultPrompt.trim() === ""
	) {
		errors.push(
			'Codex manifest field "interface.defaultPrompt" must be a non-empty string',
		);
	}
}

function git(root, args) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	}).trim();
}

// Both agents serve skills from a version-pinned cache, so a skills/ change
// that ships without a version bump never reaches them. Nothing else catches
// this: the manifest checks above only compare the two files to each other, so
// they pass green either way — which is how 0.1.5 shipped four skill changes
// late.
//
// Deliberately advisory: if the base can't be resolved (no git, no main/master,
// shallow CI clone, detached HEAD), skip rather than fail. A check that blocks
// on an unrelated environment quirk gets disabled, and then it protects nothing.
export function validateVersionBump(root) {
	let base;
	try {
		const ref = BASE_REF_CANDIDATES.find((candidate) => {
			try {
				git(root, ["rev-parse", "--verify", "--quiet", candidate]);
				return true;
			} catch {
				return false;
			}
		});
		if (!ref) return [];
		base = git(root, ["merge-base", ref, "HEAD"]);
	} catch {
		return [];
	}

	let touched;
	try {
		// Diff base against the working tree, not HEAD: capture/fix run
		// validate:catalog before committing, so the change is still unstaged.
		const changed = git(root, ["diff", "--name-only", base, "--"]).split("\n");
		// git diff never reports untracked files, and capture's new-feature path
		// creates skills/<topic>/ then validates before staging — the exact case
		// where a bump matters most. --exclude-standard so ignored scratch files
		// don't trigger it.
		const added = git(root, [
			"ls-files",
			"--others",
			"--exclude-standard",
		]).split("\n");
		touched = [...new Set([...changed, ...added])]
			.filter(Boolean)
			.filter((file) => BUMP_TRIGGERS.some((dir) => file.startsWith(dir)))
			.sort();
	} catch {
		return [];
	}
	if (touched.length === 0) return [];

	let baseVersion;
	try {
		baseVersion = JSON.parse(
			git(root, ["show", `${base}:.claude-plugin/plugin.json`]),
		).version;
	} catch {
		return [];
	}

	const manifest = join(root, ".claude-plugin", "plugin.json");
	if (!existsSync(manifest)) return [];
	let currentVersion;
	try {
		currentVersion = JSON.parse(readFileSync(manifest, "utf8")).version;
	} catch {
		return [];
	}

	if (baseVersion !== currentVersion) return [];
	return [
		`version still "${currentVersion}" but ${touched.length} file(s) under skills/ or commands/ changed since ${base.slice(0, 7)} (e.g. ${touched[0]}) — bump both plugin manifests, or Claude Code and Codex will keep serving the cached old skills`,
	];
}

export function validatePluginManifests(root) {
	const errors = validateVersionBump(root);
	const claude = readJson(
		join(root, ".claude-plugin", "plugin.json"),
		".claude-plugin/plugin.json",
		errors,
	);
	const codex = readJson(
		join(root, ".codex-plugin", "plugin.json"),
		".codex-plugin/plugin.json",
		errors,
	);
	if (!claude || !codex) return errors;

	validateCodexShape(root, codex, errors);

	for (const field of SHARED_FIELDS) {
		if (claude[field] !== codex[field]) {
			errors.push(
				`${field} mismatch: Claude has "${claude[field]}", Codex has "${codex[field]}"`,
			);
		}
	}

	if (!sameJson(claude.keywords, codex.keywords)) {
		errors.push("keywords mismatch between Claude and Codex manifests");
	}

	return errors;
}

if (
	process.argv[1] &&
	import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))
) {
	const errors = validatePluginManifests(process.cwd());
	for (const error of errors) console.error(`ERROR: ${error}`);
	console.log(
		errors.length === 0 ? "plugin manifests ok" : `${errors.length} error(s)`,
	);
	process.exit(errors.length === 0 ? 0 : 1);
}
