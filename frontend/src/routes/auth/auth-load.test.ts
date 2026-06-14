import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
	authenticated: false,
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
	isAuthenticated: vi.fn(() => authState.authenticated),
}));

import { restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('auth page load guard', () => {
	beforeEach(() => {
		authState.authenticated = false;
		vi.clearAllMocks();
		vi.mocked(restoreSession).mockResolvedValue();
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('redirects an authenticated user to /lists after restoring the session', async () => {
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.authenticated = true;
		});

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
});
