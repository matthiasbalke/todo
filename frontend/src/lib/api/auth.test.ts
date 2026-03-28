import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getLoginOptions,
	getRegisterOptions,
	logout,
	refreshAccessToken,
	submitLogin,
	submitRegistration,
} from './auth';

describe('auth API client', () => {
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

	it('getRegisterOptions sends POST with email and displayName', async () => {
		fetchSpy.mockReturnValue(mockOkResponse({ challenge: 'abc' }));

		await getRegisterOptions('user@example.com', 'User');

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/webauthn/register-options',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ email: 'user@example.com', displayName: 'User' }),
			}),
		);
	});

	it('getLoginOptions takes no parameters and sends POST', async () => {
		fetchSpy.mockReturnValue(mockOkResponse({ challenge: 'xyz' }));

		await getLoginOptions();

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/webauthn/login-options',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
			}),
		);
		// Verify no email is sent (prevents email enumeration)
		const callArgs = fetchSpy.mock.calls[0][1] as RequestInit;
		const body = JSON.parse(callArgs.body as string);
		expect(body).not.toHaveProperty('email');
	});

	it('submitRegistration sends POST with credential and credentials:include', async () => {
		const fakeResponse = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		fetchSpy.mockReturnValue(mockOkResponse(fakeResponse));

		const credential = { id: 'cred-id', type: 'public-key' } as never;
		const result = await submitRegistration(credential);

		expect(result.accessToken).toBe('tok');
		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/webauthn/register',
			expect.objectContaining({
				credentials: 'include',
				method: 'POST',
			}),
		);
	});

	it('submitRegistration response does not contain refreshToken', async () => {
		const fakeResponse = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		fetchSpy.mockReturnValue(mockOkResponse(fakeResponse));

		const result = await submitRegistration({} as never);

		expect(result).not.toHaveProperty('refreshToken');
	});

	it('submitLogin sends POST with credential and credentials:include', async () => {
		const fakeResponse = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		fetchSpy.mockReturnValue(mockOkResponse(fakeResponse));

		const credential = { id: 'cred-id', type: 'public-key' } as never;
		await submitLogin(credential);

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/webauthn/login',
			expect.objectContaining({ credentials: 'include', method: 'POST' }),
		);
	});

	it('refreshAccessToken sends POST to /api/auth/refresh with credentials:include', async () => {
		const fakeResponse = { accessToken: 'new-tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		fetchSpy.mockReturnValue(mockOkResponse(fakeResponse));

		await refreshAccessToken();

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/refresh',
			expect.objectContaining({ credentials: 'include', method: 'POST' }),
		);
	});

	it('logout sends POST with Authorization header and credentials:include', async () => {
		fetchSpy.mockReturnValue(
			Promise.resolve({ ok: true, status: 204, statusText: 'No Content' } as Response),
		);

		await logout('my-access-token');

		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/auth/logout',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.objectContaining({
					Authorization: 'Bearer my-access-token',
				}),
			}),
		);
	});
});
