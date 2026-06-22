import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserState = vi.hoisted(() => ({
	browser: true,
}));

vi.mock('$app/environment', () => ({
	get browser() {
		return browserState.browser;
	},
}));
vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
}));
vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn(),
}));

import { checkHealth } from '$lib/api/health';
import { restoreSession } from '$lib/stores/auth.svelte';
import { load } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('root page load guard', () => {
	beforeEach(() => {
		browserState.browser = true;
		vi.clearAllMocks();
		vi.mocked(checkHealth).mockResolvedValue(true);
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');
	});

	it('can server-render the startup screen before browser-only session restoration', () => {
		expect(load).toBeDefined();
	});

	it('restores the session before redirecting an authenticated user to /lists', async () => {
		vi.mocked(restoreSession).mockResolvedValue('authenticated');

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/lists',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('redirects an unauthenticated user to /auth after restoration', async () => {
		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/auth',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('returns startup state when the backend is unavailable during restoration', async () => {
		vi.mocked(restoreSession).mockResolvedValue('unavailable');

		await expect(load({ fetch: fetchFn } as never)).resolves.toEqual({ startup: true });
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('returns startup state immediately when backend health is unavailable', async () => {
		vi.mocked(checkHealth).mockResolvedValue(false);

		await expect(load({ fetch: fetchFn } as never)).resolves.toEqual({ startup: true });
		expect(checkHealth).toHaveBeenCalledWith(fetchFn);
		expect(restoreSession).not.toHaveBeenCalled();
	});

	it('server-renders startup state instead of attempting browser-only session restoration', async () => {
		browserState.browser = false;

		await expect(load({ fetch: fetchFn } as never)).resolves.toEqual({ startup: true });
		expect(checkHealth).not.toHaveBeenCalled();
		expect(restoreSession).not.toHaveBeenCalled();
	});
});
