import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	platform: "node",
	esbuildOptions(options) {
		options.alias = {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		};
	},
});
