import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
}));

import { restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('auth page load guard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('redirects an authenticated user to /lists after restoring the session', async () => {
		vi.mocked(restoreSession).mockResolvedValue('authenticated');

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/lists',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('allows an unauthenticated user to view the auth page', async () => {
		await expect(load({ fetch: fetchFn } as never)).resolves.toBeUndefined();
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('routes backend-unavailable startup through /', async () => {
		vi.mocked(restoreSession).mockResolvedValue('backend-unavailable');

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/',
		});
	});
});
