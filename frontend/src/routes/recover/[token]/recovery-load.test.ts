import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/recovery', () => ({
	getRecoveryInfo: vi.fn(),
}));

import { ApiError } from '$lib/api/client';
import { getRecoveryInfo } from '$lib/api/recovery';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;
const params = { token: 'secret' };

describe('recovery page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getRecoveryInfo).mockResolvedValue({
			email: 'user@example.com',
			displayName: 'User',
			expiresAt: '2026-06-23T12:00:00Z',
		});
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('loads recovery info for valid links', async () => {
		await expect(load({ params, fetch: fetchFn } as never)).resolves.toMatchObject({
			token: 'secret',
			recovery: {
				email: 'user@example.com',
			},
		});
		expect(getRecoveryInfo).toHaveBeenCalledWith('secret', fetchFn);
	});

	it('shows a blocked account error for links whose user was blocked later', async () => {
		vi.mocked(getRecoveryInfo).mockRejectedValue(new ApiError(409, 'Account is blocked'));

		await expect(load({ params, fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 403,
			body: {
				message: 'This account is blocked. Please contact the admin.',
			},
		});
	});

	it('does not classify unrelated recovery conflicts as blocked accounts', async () => {
		vi.mocked(getRecoveryInfo).mockRejectedValue(new ApiError(409, 'Recovery credential did not match the target account'));

		await expect(load({ params, fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 409,
			body: {
				message: 'Recovery credential did not match the target account',
			},
		});
	});

	it('keeps expired and used recovery link messages', async () => {
		vi.mocked(getRecoveryInfo).mockRejectedValue(new ApiError(410, 'Recovery link has expired'));

		await expect(load({ params, fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 410,
			body: {
				message: 'Recovery link has expired',
			},
		});
	});

	it('uses a generic message for invalid recovery links', async () => {
		vi.mocked(getRecoveryInfo).mockRejectedValue(new ApiError(404, 'Recovery link not found'));

		await expect(load({ params, fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 404,
			body: {
				message: 'Recovery link is invalid or expired.',
			},
		});
	});
});
