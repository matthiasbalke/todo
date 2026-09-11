import type { ThemePreference } from '$lib/api/users';

export type EffectiveTheme = 'light' | 'dark';

const themeColors: Record<EffectiveTheme, string> = {
	light: '#f9fafb',
	dark: '#111827'
};

let themePreference = $state<ThemePreference>('SYSTEM');
let themeOverride = $state<ThemePreference | null>(null);
let effectiveTheme = $state<EffectiveTheme>('light');
let mediaQuery: MediaQueryList | null = null;

export function isThemePreference(value: unknown): value is ThemePreference {
	return value === 'SYSTEM' || value === 'LIGHT' || value === 'DARK';
}

export function normalizeThemePreference(value: unknown): ThemePreference {
	return isThemePreference(value) ? value : 'SYSTEM';
}

export function resolveEffectiveTheme(
	preference: ThemePreference,
	systemPrefersDark: boolean
): EffectiveTheme {
	if (preference === 'LIGHT') return 'light';
	if (preference === 'DARK') return 'dark';
	return systemPrefersDark ? 'dark' : 'light';
}

export function getThemePreference(): ThemePreference {
	return themePreference;
}

export function getThemeOverride(): ThemePreference | null {
	return themeOverride;
}

export function getEffectiveTheme(): EffectiveTheme {
	return effectiveTheme;
}

export function setThemePreference(preference: ThemePreference): void {
	themePreference = preference;
	applyCurrentTheme();
}

export function setThemeOverride(preference: ThemePreference): void {
	themeOverride = preference;
	applyCurrentTheme();
}

export function clearThemeOverride(): void {
	themeOverride = null;
	applyCurrentTheme();
}

export function installThemeHandling(): () => void {
	const query = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery = query;
	applyCurrentTheme();

	const handleChange = () => applyCurrentTheme();
	query.addEventListener('change', handleChange);
	return () => {
		query.removeEventListener('change', handleChange);
		if (mediaQuery === query) mediaQuery = null;
	};
}

function applyCurrentTheme(): void {
	const resolved = resolveEffectiveTheme(themeOverride ?? themePreference, mediaQuery?.matches ?? false);
	effectiveTheme = resolved;

	if (typeof document === 'undefined') return;

	document.documentElement.dataset.theme = resolved;
	document.documentElement.style.colorScheme = resolved;
	updateThemeColor(resolved);
}

function updateThemeColor(theme: EffectiveTheme): void {
	let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	if (!meta) {
		meta = document.createElement('meta');
		meta.name = 'theme-color';
		document.head.append(meta);
	}
	meta.content = themeColors[theme];
}
