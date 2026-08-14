import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSetupOptions, submitSetupRegistration } from './setup';

describe('setup API client', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function mockOkResponse(body: unknown) {
		return Promise.resolve({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: () => Promise.resolve(body),
		} as Response);
	}

	it('getSetupOptions sends setup secret with admin identity fields', async () => {
		fetchSpy.mockReturnValue(mockOkResponse({ challenge: 'abc' }));

		await getSetupOptions('admin@example.com', 'Admin', 'setup-secret');

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/setup/webauthn/register-options',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({
					email: 'admin@example.com',
					displayName: 'Admin',
					setupSecret: 'setup-secret',
				}),
			}),
		);
	});

	it('submitSetupRegistration sends credential, setup secret, and optional label', async () => {
		fetchSpy.mockReturnValue(
			mockOkResponse({
				accessToken: 'token',
				user: { id: '1', email: 'admin@example.com', displayName: 'Admin', admin: true },
			}),
		);
		const credential = { id: 'cred-id', type: 'public-key' } as never;

		await submitSetupRegistration(credential, 'setup-secret', 'Admin key');

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/setup/webauthn/register',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({
					credential,
					setupSecret: 'setup-secret',
					label: 'Admin key',
				}),
			}),
		);
	});
});
