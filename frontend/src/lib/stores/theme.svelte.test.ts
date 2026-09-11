import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getEffectiveTheme,
	getThemeOverride,
	installThemeHandling,
	normalizeThemePreference,
	resolveEffectiveTheme,
	clearThemeOverride,
	setThemePreference,
	setThemeOverride
} from './theme.svelte';

describe('theme preference handling', () => {
	let listeners: ((event: MediaQueryListEvent) => void)[];
	let matchesDark = false;

	beforeEach(() => {
		listeners = [];
		matchesDark = false;
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.style.removeProperty('color-scheme');
		document.querySelector('meta[name="theme-color"]')?.remove();
		clearThemeOverride();
		setThemePreference('SYSTEM');
		vi.stubGlobal('matchMedia', vi.fn(() => ({
			get matches() {
				return matchesDark;
			},
			media: '(prefers-color-scheme: dark)',
			addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.push(listener),
			removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
				listeners = listeners.filter((candidate) => candidate !== listener);
			},
		})));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('normalizes unsupported values to SYSTEM', () => {
		expect(normalizeThemePreference('LIGHT')).toBe('LIGHT');
		expect(normalizeThemePreference('not-a-theme')).toBe('SYSTEM');
		expect(normalizeThemePreference(undefined)).toBe('SYSTEM');
	});

	it('resolves explicit and system preferences', () => {
		expect(resolveEffectiveTheme('LIGHT', true)).toBe('light');
		expect(resolveEffectiveTheme('DARK', false)).toBe('dark');
		expect(resolveEffectiveTheme('SYSTEM', false)).toBe('light');
		expect(resolveEffectiveTheme('SYSTEM', true)).toBe('dark');
	});

	it('uses system theme before profile preferences are applied', () => {
		matchesDark = true;

		const cleanup = installThemeHandling();

		expect(getEffectiveTheme()).toBe('dark');
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
		cleanup();
	});

	it('updates when system preference changes while SYSTEM is selected', () => {
		const cleanup = installThemeHandling();
		expect(getEffectiveTheme()).toBe('light');

		matchesDark = true;
		listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));

		expect(getEffectiveTheme()).toBe('dark');
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		cleanup();
	});

	it('ignores system changes when an explicit theme is selected', () => {
		matchesDark = true;
		const cleanup = installThemeHandling();

		setThemePreference('LIGHT');
		listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));

		expect(getEffectiveTheme()).toBe('light');
		expect(document.documentElement).toHaveAttribute('data-theme', 'light');
		cleanup();
	});

	it('allows a temporary theme override without changing the stored preference', () => {
		const cleanup = installThemeHandling();

		setThemePreference('DARK');
		setThemeOverride('LIGHT');

		expect(getThemeOverride()).toBe('LIGHT');
		expect(getEffectiveTheme()).toBe('light');
		expect(document.documentElement).toHaveAttribute('data-theme', 'light');

		clearThemeOverride();

		expect(getThemeOverride()).toBeNull();
		expect(getEffectiveTheme()).toBe('dark');
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		cleanup();
	});
});
