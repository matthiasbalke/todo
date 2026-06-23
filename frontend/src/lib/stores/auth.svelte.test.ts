import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearSession,
	getAccessToken,
	getCurrentUser,
	isAuthenticated,
	restoreSession,
	setSession,
} from './auth.svelte';

function mockResponse(status: number, body: unknown): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
		json: () => Promise.resolve(body),
	} as Response;
}

describe('auth store', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clearSession();
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
	});

	afterEach(() => {
		clearSession();
		vi.unstubAllGlobals();
	});

	it('keeps an existing in-memory session without refreshing', async () => {
		setSession({
			accessToken: 'header.payload.signature',
			user: { id: '1', email: 'user@example.com', displayName: 'User' },
		});

		const result = await restoreSession();

		expect(result).toBe('authenticated');
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(isAuthenticated()).toBe(true);
		expect(getCurrentUser()).toMatchObject({ email: 'user@example.com' });
		expect(getAccessToken()).toBe('header.payload.signature');
	});

	it('restores a valid session from the refresh token cookie', async () => {
		fetchSpy.mockResolvedValue(
			mockResponse(200, {
				accessToken: 'new.header.signature',
				user: { id: '1', email: 'user@example.com', displayName: 'User' },
			}),
		);

		const result = await restoreSession();

		expect(result).toBe('authenticated');
		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/refresh',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
			}),
		);
		expect(isAuthenticated()).toBe(true);
		expect(getCurrentUser()).toMatchObject({ email: 'user@example.com' });
		expect(getAccessToken()).toBe('new.header.signature');
	});

	it('returns unauthenticated for a rejected refresh session', async () => {
		fetchSpy.mockResolvedValue(
			mockResponse(401, {
				message: 'Unauthorized',
				code: 'UNAUTHORIZED',
			}),
		);

		const result = await restoreSession();

		expect(result).toBe('unauthenticated');
		expect(isAuthenticated()).toBe(false);
		expect(getCurrentUser()).toBeNull();
		expect(getAccessToken()).toBeNull();
	});

	it('returns unauthenticated and clears state for a blocked refresh session', async () => {
		fetchSpy.mockResolvedValue(
			mockResponse(403, {
				message: 'Account blocked',
				code: 'ACCOUNT_BLOCKED',
			}),
		);

		const result = await restoreSession();

		expect(result).toBe('unauthenticated');
		expect(isAuthenticated()).toBe(false);
		expect(getCurrentUser()).toBeNull();
		expect(getAccessToken()).toBeNull();
	});

	it('returns unavailable when backend startup prevents refresh', async () => {
		fetchSpy.mockResolvedValue(
			mockResponse(503, {
				message: 'Backend starting',
			}),
		);

		const result = await restoreSession();

		expect(result).toBe('unavailable');
		expect(isAuthenticated()).toBe(false);
		expect(getCurrentUser()).toBeNull();
		expect(getAccessToken()).toBeNull();
	});

	it('returns unavailable for network failures while starting', async () => {
		fetchSpy.mockRejectedValue(new Error('fetch failed'));

		const result = await restoreSession();

		expect(result).toBe('unavailable');
		expect(isAuthenticated()).toBe(false);
	});
});
