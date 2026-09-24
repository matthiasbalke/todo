import { authedFetch } from './authedClient';

export interface VerificationAttempt {
	email: string;
	tokenRequested: boolean;
	startedAt: string | null;
	expiresAt: string | null;
	expired: boolean;
}

export interface EmailVerificationState {
	emailVerified: boolean;
	activeEmail: string;
	registrationVerification: VerificationAttempt | null;
	pendingEmailChange: VerificationAttempt | null;
}

export interface VerificationEmailRequestResponse {
	status: string;
	message: string;
}

export interface VerificationSubmitResponse {
	status: string;
	message: string;
	emailVerified: boolean;
	activeEmail: string;
}

export async function getEmailVerificationState(fetchFn: typeof fetch = fetch): Promise<EmailVerificationState> {
	return authedFetch<EmailVerificationState>('/api/users/me/verification', { method: 'GET' }, fetchFn);
}

export async function requestVerificationEmail(fetchFn: typeof fetch = fetch): Promise<VerificationEmailRequestResponse> {
	return authedFetch<VerificationEmailRequestResponse>(
		'/api/users/me/verification/email',
		{ method: 'POST', body: JSON.stringify({}) },
		fetchFn,
	);
}

export async function submitVerificationToken(
	validationToken: string,
	fetchFn: typeof fetch = fetch,
): Promise<VerificationSubmitResponse> {
	return authedFetch<VerificationSubmitResponse>(
		'/api/users/me/verification',
		{ method: 'POST', body: JSON.stringify({ validationToken }) },
		fetchFn,
	);
}

export async function cancelPendingEmail(fetchFn: typeof fetch = fetch): Promise<EmailVerificationState> {
	return authedFetch<EmailVerificationState>('/api/users/me/verification/pending-email', { method: 'DELETE' }, fetchFn);
}
