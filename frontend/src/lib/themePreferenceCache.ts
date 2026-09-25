import type { ThemePreference } from '$lib/api/users';

export const THEME_PREFERENCE_CACHE_KEY = 'todo_theme_preference';

export function isCachedThemePreference(value: unknown): value is ThemePreference {
	return value === 'SYSTEM' || value === 'LIGHT' || value === 'DARK';
}

export function loadCachedThemePreference(): ThemePreference | null {
	try {
		const value = localStorage.getItem(THEME_PREFERENCE_CACHE_KEY);
		return isCachedThemePreference(value) ? value : null;
	} catch {
		return null;
	}
}

export function saveCachedThemePreference(preference: ThemePreference): void {
	try {
		localStorage.setItem(THEME_PREFERENCE_CACHE_KEY, preference);
	} catch {
		// Theme cache is only a startup hint; storage failures should not affect the app.
	}
}
