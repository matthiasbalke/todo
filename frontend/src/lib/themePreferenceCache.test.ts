import { describe, expect, it, vi } from 'vitest';
import {
	loadCachedThemePreference,
	saveCachedThemePreference,
	THEME_PREFERENCE_CACHE_KEY
} from './themePreferenceCache';

function makeLocalStorage() {
	const store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			for (const key in store) delete store[key];
		}),
		store
	};
}

describe('theme preference cache', () => {
	it('loads a valid cached preference', () => {
		const ls = makeLocalStorage();
		vi.stubGlobal('localStorage', ls);
		ls.setItem(THEME_PREFERENCE_CACHE_KEY, 'DARK');

		expect(loadCachedThemePreference()).toBe('DARK');
	});

	it('returns null when no preference is cached', () => {
		vi.stubGlobal('localStorage', makeLocalStorage());

		expect(loadCachedThemePreference()).toBeNull();
	});

	it('returns null for unsupported cached values', () => {
		const ls = makeLocalStorage();
		vi.stubGlobal('localStorage', ls);
		ls.setItem(THEME_PREFERENCE_CACHE_KEY, 'sepia');

		expect(loadCachedThemePreference()).toBeNull();
	});

	it('returns null when localStorage getItem throws', () => {
		const ls = makeLocalStorage();
		ls.getItem.mockImplementation(() => {
			throw new Error('blocked');
		});
		vi.stubGlobal('localStorage', ls);

		expect(() => loadCachedThemePreference()).not.toThrow();
		expect(loadCachedThemePreference()).toBeNull();
	});

	it('saves the normalized preference key without throwing', () => {
		const ls = makeLocalStorage();
		vi.stubGlobal('localStorage', ls);

		saveCachedThemePreference('LIGHT');

		expect(ls.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_CACHE_KEY, 'LIGHT');
	});

	it('does not throw when localStorage setItem throws', () => {
		const ls = makeLocalStorage();
		ls.setItem.mockImplementation(() => {
			throw new Error('quota exceeded');
		});
		vi.stubGlobal('localStorage', ls);

		expect(() => saveCachedThemePreference('DARK')).not.toThrow();
	});
});
