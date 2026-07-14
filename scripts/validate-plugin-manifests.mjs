import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

export function validatePluginManifests(root) {
	const errors = [];
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
