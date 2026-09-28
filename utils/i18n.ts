/** Fill `{{name}}` placeholders in a translated string. */
export const interpolate = (
	template: string,
	vars: Record<string, string | number>,
): string =>
	String(template || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
		vars[key] === undefined ? "" : String(vars[key]),
	);
