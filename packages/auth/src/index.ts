// Components

export { AppearanceSettings } from "@/components/account/AppearanceSettings";
export { AuthButton } from "@/components/auth/AuthButton";
export { AuthCard } from "@/components/auth/AuthCard";
export {
	AuthConfigProvider,
	DEFAULT_AUTH_CONFIG,
	useAuthConfig,
} from "@/components/auth/AuthConfigProvider";
export { AuthError } from "@/components/auth/AuthError";
export { AuthField } from "@/components/auth/AuthField";
export { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
export { ProfilePanel } from "@/components/auth/ProfilePanel";
export { SignInForm } from "@/components/auth/SignInForm";
export { SignUpForm } from "@/components/auth/SignUpForm";
export { TestLoginButton } from "@/components/auth/TestLoginButton";
export {
	type AuthConfig,
	clerkErrorMessage,
	type SlotClassNames,
	type SocialProvider,
} from "@/components/auth/types";
export { ThemeSync } from "@/components/ThemeSync";
export { default as HeaderUser } from "@/integrations/clerk/header-user";
// Lib
export { shouldShowTestLogin } from "@/lib/authEnv";
export {
	applyThemeMode,
	getInitialMode,
	reconcileTheme,
	setThemeMode,
	THEME_INIT_SCRIPT,
	type ThemeMode,
} from "@/lib/theme";
