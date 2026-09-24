import { describe, expect, it, vi } from 'vitest';
import {
	cancelPendingEmail,
	getEmailVerificationState,
	requestVerificationEmail,
	submitVerificationToken,
} from './verification';

function jsonResponse(body: unknown): Response {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		json: () => Promise.resolve(body),
	} as Response;
}

describe('verification api', () => {
	it('loads email verification state', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ emailVerified: false, activeEmail: 'u@example.com' }));

		const state = await getEmailVerificationState(fetchFn as never);

		expect(state.emailVerified).toBe(false);
		expect(fetchFn).toHaveBeenCalledWith(
			'/api/users/me/verification',
			expect.objectContaining({ method: 'GET', credentials: 'include' }),
		);
	});

	it('requests verification email', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: 'SENT', message: 'ok' }));

		const response = await requestVerificationEmail(fetchFn as never);

		expect(response.status).toBe('SENT');
		expect(fetchFn).toHaveBeenCalledWith(
			'/api/users/me/verification/email',
			expect.objectContaining({ method: 'POST' }),
		);
	});

	it('submits verification token', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: 'VERIFIED', emailVerified: true }));

		const response = await submitVerificationToken('abc123', fetchFn as never);

		expect(response.status).toBe('VERIFIED');
		expect(fetchFn).toHaveBeenCalledWith(
			'/api/users/me/verification',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ validationToken: 'abc123' }) }),
		);
	});

	it('cancels pending email', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ emailVerified: true, pendingEmailChange: null }));

		const response = await cancelPendingEmail(fetchFn as never);

		expect(response.pendingEmailChange).toBeNull();
		expect(fetchFn).toHaveBeenCalledWith(
			'/api/users/me/verification/pending-email',
			expect.objectContaining({ method: 'DELETE' }),
		);
	});
});
