import { beforeEach, describe, expect, it, vi } from 'vitest';

let accessToken: string | null = null;

vi.mock('$lib/stores/auth.svelte', () => ({
	getAccessToken: vi.fn(() => accessToken),
	setSession: vi.fn((response: { accessToken: string }) => {
		accessToken = response.accessToken;
	}),
	clearSession: vi.fn(() => {
		accessToken = null;
	}),
}));

import { clearSession, setSession } from '$lib/stores/auth.svelte';
import { authedFetch } from './authedClient';

function jsonResponse(status: number, body: unknown): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
		json: () => Promise.resolve(body),
	} as Response;
}

describe('authedFetch', () => {
	beforeEach(() => {
		accessToken = null;
		vi.clearAllMocks();
	});

	it('restores the access token before protected requests when memory state is empty', async () => {
		const fetchFn = vi.fn()
			.mockResolvedValueOnce(jsonResponse(200, {
				accessToken: 'restored-token',
				user: { id: '1', email: 'admin@example.com', displayName: 'Admin', admin: true },
			}))
			.mockResolvedValueOnce(jsonResponse(200, { registrationEnabled: true }));

		await expect(authedFetch('/api/admin/settings', undefined, fetchFn as unknown as typeof fetch))
			.resolves.toEqual({ registrationEnabled: true });

		expect(fetchFn).toHaveBeenNthCalledWith(
			1,
			'/api/auth/refresh',
			expect.objectContaining({ method: 'POST', credentials: 'include' }),
		);
		expect(fetchFn).toHaveBeenNthCalledWith(
			2,
			'/api/admin/settings',
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer restored-token' }),
			}),
		);
		expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'restored-token' }));
	});

	it('clears the session and shows a blocked account message when the access token is rejected', async () => {
		accessToken = 'blocked-token';
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse(403, {
			code: 'ACCOUNT_BLOCKED',
			message: 'Account is blocked',
		}));

		await expect(authedFetch('/api/users/me', undefined, fetchFn as unknown as typeof fetch))
			.rejects.toMatchObject({
				status: 403,
				code: 'ACCOUNT_BLOCKED',
				message: 'Your account is blocked. Please contact the admin.',
			});

		expect(clearSession).toHaveBeenCalled();
	});
});
