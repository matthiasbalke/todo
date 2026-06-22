import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
	authenticated: false,
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
	isAuthenticated: vi.fn(() => authState.authenticated),
}));
vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn(),
}));

import { checkHealth } from '$lib/api/health';
import { restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('auth page load guard', () => {
	beforeEach(() => {
		authState.authenticated = false;
		vi.clearAllMocks();
		vi.mocked(checkHealth).mockResolvedValue(true);
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('redirects an authenticated user to /lists after restoring the session', async () => {
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.authenticated = true;
			return 'authenticated';
		});

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/lists',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('allows an unauthenticated user to view the auth page', async () => {
		await expect(load({ fetch: fetchFn } as never)).resolves.toMatchObject({
			restoreStatus: 'unauthenticated',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('routes backend-unavailable startup through / before auth controls render', async () => {
		vi.mocked(restoreSession).mockResolvedValue('unavailable');

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/',
		});
		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
	});

	it('routes unavailable health through / without attempting session restoration', async () => {
		vi.mocked(checkHealth).mockResolvedValue(false);

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/',
		});
		expect(checkHealth).toHaveBeenCalledWith(fetchFn);
		expect(restoreSession).not.toHaveBeenCalled();
	});
});
