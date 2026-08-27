// Cross-platform replacement for the PowerShell Codex setup scripts, so a Mac
// or Linux device can mirror this repo into Codex the same way Windows does.
//
//   node scripts/setup-codex.mjs          clone or pull ~/plugins/<name> from GitHub
//   node scripts/setup-codex.mjs --dev    link ~/plugins/<name> at this checkout
import { execFileSync } from "node:child_process";
import {
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
	readFileSync(join(repoRoot, ".claude-plugin", "plugin.json"), "utf8"),
);
const pluginName = manifest.name;
const repoUrl = `${manifest.repository}.git`;

const pluginsRoot = join(homedir(), "plugins");
const pluginPath = join(pluginsRoot, pluginName);
const marketplacePath = join(homedir(), ".agents", "plugins", "marketplace.json");
const dev = process.argv.includes("--dev");

const git = (...args) =>
	execFileSync("git", args, { encoding: "utf8", stdio: "inherit" });

function isLink(path) {
	try {
		return lstatSync(path).isSymbolicLink();
	} catch {
		return false;
	}
}

function ensureDevLink() {
	mkdirSync(pluginsRoot, { recursive: true });
	if (existsSync(pluginPath)) {
		if (!isLink(pluginPath)) {
			throw new Error(
				`${pluginPath} exists and is not a link. Move it before using --dev.`,
			);
		}
		const actual = resolve(readlinkSync(pluginPath));
		if (actual !== repoRoot) {
			throw new Error(`${pluginPath} points at ${actual}, expected ${repoRoot}.`);
		}
		console.log(`exists: ${pluginPath} -> ${repoRoot}`);
		return;
	}
	// "junction" avoids needing Developer Mode or admin rights on Windows.
	symlinkSync(repoRoot, pluginPath, platform() === "win32" ? "junction" : "dir");
	console.log(`linked: ${pluginPath} -> ${repoRoot}`);
}

function ensureGithubClone() {
	mkdirSync(pluginsRoot, { recursive: true });
	if (!existsSync(pluginPath)) {
		git("clone", repoUrl, pluginPath);
		return;
	}
	if (isLink(pluginPath)) {
		throw new Error(`${pluginPath} is a link. Use --dev, or replace it first.`);
	}
	if (!existsSync(join(pluginPath, ".git"))) {
		throw new Error(`${pluginPath} exists and is not a git clone. Move it first.`);
	}
	git("-C", pluginPath, "pull", "--ff-only");
}

function ensureMarketplaceEntry() {
	mkdirSync(dirname(marketplacePath), { recursive: true });
	const marketplace = existsSync(marketplacePath)
		? JSON.parse(readFileSync(marketplacePath, "utf8"))
		: {};

	marketplace.name ??= "personal";
	marketplace.interface ??= { displayName: "Personal" };
	marketplace.plugins = (marketplace.plugins ?? []).filter(
		(p) => p.name !== pluginName,
	);
	marketplace.plugins.push({
		name: pluginName,
		source: { source: "local", path: `./plugins/${pluginName}` },
		policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
		category: "Productivity",
	});

	writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
	console.log(`marketplace: ${marketplacePath}`);
}

if (dev) ensureDevLink();
else ensureGithubClone();
ensureMarketplaceEntry();
console.log(`\nInstall or refresh with: codex plugin add ${pluginName}@personal`);
console.log("Start a new Codex task afterwards so plugin skills reload.");
