import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/auth', () => ({
	refreshAccessToken: vi.fn(),
	ApiError: class ApiError extends Error {
		constructor(
			public status: number,
			message: string,
			public code?: string,
		) {
			super(message);
		}
	},
}));

import { refreshAccessToken, ApiError } from '$lib/api/auth';
import { clearSession, isAuthenticated, restoreSession, setSession } from './auth.svelte';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('auth store session restoration', () => {
	beforeEach(() => {
		clearSession();
		vi.clearAllMocks();
	});

	it('returns authenticated when a session already exists', async () => {
		setSession({
			accessToken: 'header.payload.signature',
			user: { id: 'u1', email: 'user@example.com', displayName: 'User' },
		});

		await expect(restoreSession(fetchFn)).resolves.toBe('authenticated');
		expect(refreshAccessToken).not.toHaveBeenCalled();
		expect(isAuthenticated()).toBe(true);
	});

	it('returns authenticated when refresh succeeds', async () => {
		const response = {
			accessToken: 'new.token.value',
			user: { id: 'u1', email: 'user@example.com', displayName: 'User' },
		};
		vi.mocked(refreshAccessToken).mockResolvedValue(response);

		await expect(restoreSession(fetchFn)).resolves.toBe('authenticated');
		expect(refreshAccessToken).toHaveBeenCalledWith(fetchFn);
		expect(isAuthenticated()).toBe(true);
	});

	it('returns unauthenticated for invalid refresh sessions', async () => {
		vi.mocked(refreshAccessToken).mockRejectedValue(new ApiError(401, 'Unauthorized'));

		await expect(restoreSession(fetchFn)).resolves.toBe('unauthenticated');
		expect(isAuthenticated()).toBe(false);
	});

	it('returns backend-unavailable for transient refresh failures', async () => {
		vi.mocked(refreshAccessToken).mockRejectedValue(new ApiError(503, 'Service Unavailable'));

		await expect(restoreSession(fetchFn)).resolves.toBe('backend-unavailable');
		expect(isAuthenticated()).toBe(false);
	});

	it('returns backend-unavailable when fetch rejects', async () => {
		vi.mocked(refreshAccessToken).mockRejectedValue(new TypeError('fetch failed'));

		await expect(restoreSession(fetchFn)).resolves.toBe('backend-unavailable');
		expect(isAuthenticated()).toBe(false);
	});
});
