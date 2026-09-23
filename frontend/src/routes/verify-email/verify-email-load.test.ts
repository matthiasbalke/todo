import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn(),
}));
vi.mock('$lib/api/setup', () => ({
	getSetupStatus: vi.fn(),
}));
vi.mock('$lib/api/verification', () => ({
	getEmailVerificationState: vi.fn(),
}));
vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(),
	getCurrentUser: vi.fn(),
}));

import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { getEmailVerificationState } from '$lib/api/verification';
import { getCurrentUser, restoreSession } from '$lib/stores/auth.svelte';
import { load, ssr } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;
const url = new URL('https://todo.example/verify-email?validation_token=abc123');

const unverifiedState = {
	emailVerified: false,
	activeEmail: 'test@example.com',
	registrationVerification: {
		email: 'test@example.com',
		tokenRequested: true,
		startedAt: '2026-09-23T00:00:00Z',
		expiresAt: '2026-09-23T00:30:00Z',
		expired: false,
	},
	pendingEmailChange: null,
};

describe('verify email page load guard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(checkHealth).mockResolvedValue(true);
		vi.mocked(getSetupStatus).mockResolvedValue({ setupRequired: false });
		vi.mocked(restoreSession).mockResolvedValue('authenticated');
		vi.mocked(getCurrentUser).mockReturnValue({
			id: 'user-1',
			email: 'test@example.com',
			displayName: 'Test',
			emailVerified: false,
		});
		vi.mocked(getEmailVerificationState).mockResolvedValue(unverifiedState);
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('loads verification state and keeps validation token from the URL', async () => {
		await expect(load({ fetch: fetchFn, url } as never)).resolves.toEqual({
			state: unverifiedState,
			validationToken: 'abc123',
		});
		expect(getEmailVerificationState).toHaveBeenCalledWith(fetchFn);
	});

	it('redirects unauthenticated users to auth', async () => {
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');

		await expect(load({ fetch: fetchFn, url } as never)).rejects.toMatchObject({
			status: 307,
			location: '/auth',
		});
	});

	it('redirects verified users without pending email changes to the app', async () => {
		vi.mocked(getCurrentUser).mockReturnValue({
			id: 'user-1',
			email: 'test@example.com',
			displayName: 'Test',
			emailVerified: true,
		});
		vi.mocked(getEmailVerificationState).mockResolvedValue({
			emailVerified: true,
			activeEmail: 'test@example.com',
			registrationVerification: null,
			pendingEmailChange: null,
		});

		await expect(load({ fetch: fetchFn, url } as never)).rejects.toMatchObject({
			status: 307,
			location: '/lists',
		});
	});
});
