export function isLocale<L extends string>(
	locales: readonly L[],
	value: unknown,
): value is L {
	return (locales as readonly unknown[]).includes(value);
}

/**
 * Resolve the active locale: explicit cookie choice first, then the first
 * Accept-Language entry matching a supported locale, then the fallback.
 */
export function resolveLocale<L extends string>(
	locales: readonly L[],
	fallback: L,
	cookieValue: string | undefined,
	acceptLanguage: string | undefined,
): L {
	if (isLocale(locales, cookieValue)) {
		return cookieValue;
	}
	if (acceptLanguage) {
		for (const part of acceptLanguage.split(",")) {
			const tag = part.split(";")[0]?.trim().toLowerCase();
			if (!tag) {
				continue;
			}
			for (const locale of locales) {
				if (tag === locale || tag.startsWith(`${locale}-`)) {
					return locale;
				}
			}
		}
	}
	return fallback;
}

/** Interpolate {name} placeholders. Unknown placeholders are left as-is. */
export function fmt(
	template: string,
	params: Record<string, string | number>,
): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) =>
		key in params ? String(params[key]) : match,
	);
}

/** Pick a plural form and fill {count}. Assumes one/other CLDR categories. */
export function plural<L extends string>(
	locale: L,
	count: number,
	forms: { one: string; other: string },
): string {
	const category = new Intl.PluralRules(locale).select(count);
	const template = category === "one" ? forms.one : forms.other;
	return fmt(template, { count });
}
