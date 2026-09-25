import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_PREFERENCE_CACHE_KEY } from '$lib/themePreferenceCache';

const appHtml = readFileSync('src/app.html', 'utf8');
const bootstrapScript = appHtml.match(
	/<script nonce="%sveltekit\.nonce%">(?<script>[\s\S]*?todo_theme_preference[\s\S]*?)<\/script>/
)?.groups?.script;

function runBootstrap(): void {
	if (!bootstrapScript) throw new Error('Theme bootstrap script not found');
	window.eval(bootstrapScript);
}

describe('app.html theme bootstrap', () => {
	let matchesDark = false;

	beforeEach(() => {
		matchesDark = false;
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.style.removeProperty('color-scheme');
		document.head.innerHTML = '<meta name="theme-color" content="#f9fafb" />';
		vi.stubGlobal('matchMedia', vi.fn(() => ({
			get matches() {
				return matchesDark;
			},
			media: '(prefers-color-scheme: dark)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('applies cached dark theme before app hydration', () => {
		localStorage.setItem(THEME_PREFERENCE_CACHE_KEY, 'DARK');

		runBootstrap();

		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		expect(document.documentElement.style.colorScheme).toBe('dark');
		expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
	});

	it('falls back to the system theme when the cached preference is invalid', () => {
		localStorage.setItem(THEME_PREFERENCE_CACHE_KEY, 'sepia');
		matchesDark = true;

		runBootstrap();

		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
	});

	it('falls back to the system theme when localStorage throws', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		matchesDark = true;

		runBootstrap();

		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
	});
});
