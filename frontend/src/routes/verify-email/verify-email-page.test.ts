import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/api/auth', () => ({
	refreshAccessToken: vi.fn(),
	ApiError: class ApiError extends Error {
		constructor(public status: number, message: string, public code?: string) {
			super(message);
		}
	},
}));

vi.mock('$lib/api/verification', () => ({
	getEmailVerificationState: vi.fn(),
	requestVerificationEmail: vi.fn(),
	submitVerificationToken: vi.fn(),
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	setSession: vi.fn(),
}));

import { goto } from '$app/navigation';
import { refreshAccessToken } from '$lib/api/auth';
import {
	getEmailVerificationState,
	requestVerificationEmail,
	submitVerificationToken,
} from '$lib/api/verification';
import { setSession } from '$lib/stores/auth.svelte';
import VerifyEmailPage from './+page.svelte';

const pendingState = {
	emailVerified: false,
	activeEmail: 'test@example.com',
	registrationVerification: {
		email: 'test@example.com',
		tokenRequested: false,
		startedAt: null,
		expiresAt: null,
		expired: false,
	},
	pendingEmailChange: null,
};

describe('VerifyEmailPage', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('requests a verification email and refreshes the displayed state', async () => {
		vi.mocked(requestVerificationEmail).mockResolvedValueOnce({ status: 'SENT', message: 'ok' });
		vi.mocked(getEmailVerificationState).mockResolvedValueOnce({
			...pendingState,
			registrationVerification: {
				...pendingState.registrationVerification,
				tokenRequested: true,
				startedAt: '2026-09-23T00:00:00Z',
				expiresAt: '2026-09-23T00:30:00Z',
			},
		});
		render(VerifyEmailPage, { props: { data: { state: pendingState, validationToken: '' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'Send verification email' }));

		expect(requestVerificationEmail).toHaveBeenCalledOnce();
		expect(await screen.findByText('Verification email sent.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();
	});

	it('submits a token, refreshes the session, and continues to the app', async () => {
		vi.mocked(submitVerificationToken).mockResolvedValueOnce({
			status: 'VERIFIED',
			message: 'ok',
			emailVerified: true,
			activeEmail: 'test@example.com',
		});
		const session = {
			accessToken: 'tok',
			user: { id: 'user-1', email: 'test@example.com', displayName: 'Test', emailVerified: true },
		};
		vi.mocked(refreshAccessToken).mockResolvedValueOnce(session);
		render(VerifyEmailPage, { props: { data: { state: pendingState, validationToken: 'abc123' } } });

		await waitFor(() => expect(submitVerificationToken).toHaveBeenCalledWith('abc123'));
		expect(setSession).toHaveBeenCalledWith(session);
		await fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

		expect(goto).toHaveBeenCalledWith('/lists');
	});

	it('shows expired state for an expired requested token', () => {
		render(VerifyEmailPage, {
			props: {
				data: {
					state: {
						...pendingState,
						registrationVerification: {
							...pendingState.registrationVerification,
							tokenRequested: true,
							expired: true,
						},
					},
					validationToken: '',
				},
			},
		});

		expect(screen.getByText('Verification token is no longer valid.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Resend email' })).toBeInTheDocument();
	});
});
