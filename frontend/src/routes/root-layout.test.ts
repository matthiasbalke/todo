import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/version', () => ({ appVersion: '0.0.0' }));
import RootLayout from './+layout.svelte';

describe('root layout theme startup', () => {
	beforeEach(() => {
		document.body.removeAttribute('data-hydrated');
		document.documentElement.removeAttribute('data-theme');
		vi.stubGlobal('matchMedia', vi.fn(() => ({
			matches: true,
			media: '(prefers-color-scheme: dark)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})));
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it('applies system theme before marking the app hydrated', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Page content</p>' }));
		render(RootLayout, { props: { data: { buildNumber: '0' }, children } });

		expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
		expect(document.body).toHaveAttribute('data-hydrated', 'true');
		expect(document.querySelector('[data-diagnostic-palette-control]')).not.toBeInTheDocument();
	});
});
