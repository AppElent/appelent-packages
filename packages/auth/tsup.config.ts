import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	external: ["react", "react-dom", "@clerk/clerk-react"],
	esbuildOptions(options) {
		options.alias = {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		};
	},
});
