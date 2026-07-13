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
