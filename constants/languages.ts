// The language switcher options, shared by the header and the auth screens so
// all three dropdowns always offer exactly the same list.

export type LanguageOption = {
	code: string;
	name: string;
	flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
	{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
	{ code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },
];
