import { CliError } from "./errors";
import type { CliRuntime } from "./run";

export async function startBrowserLogin(runtime: CliRuntime): Promise<void> {
	throw new CliError(
		"Unsupported",
		`Browser login is not available yet. Use \`${runtime.appName} auth login --token <token>\`.`,
	);
}
