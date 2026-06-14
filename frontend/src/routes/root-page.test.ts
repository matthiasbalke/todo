import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
}));

import { restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('root page load guard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
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
		vi.mocked(restoreSession).mockResolvedValue('backend-unavailable');

		await expect(load({ fetch: fetchFn } as never)).resolves.toEqual({ startup: true });
	});
});
