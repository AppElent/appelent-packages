import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/index.tsx",
		"src/server.ts",
		"src/clerk-sync.tsx",
		"src/test-utils.ts",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	external: [
		"react",
		"react-dom",
		"@tanstack/react-start",
		"@clerk/clerk-react",
		"vitest",
	],
	esbuildOptions(options) {
		options.alias = {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		};
	},
});
