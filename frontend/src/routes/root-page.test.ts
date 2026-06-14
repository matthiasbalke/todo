import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
	authenticated: false,
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
	isAuthenticated: vi.fn(() => authState.authenticated),
}));

import { isAuthenticated, restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('root page load guard', () => {
	beforeEach(() => {
		authState.authenticated = false;
		vi.clearAllMocks();
		vi.mocked(restoreSession).mockResolvedValue();
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('restores the session before redirecting an authenticated user to /lists', async () => {
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.authenticated = true;
		});

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/lists',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
		expect(isAuthenticated).toHaveBeenCalled();
	});

	it('redirects an unauthenticated user to /auth after restoration', async () => {
		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/auth',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('redirects to /auth when session restoration cannot authenticate the user', async () => {
		vi.mocked(restoreSession).mockResolvedValue();

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/auth',
		});
	});
});
