import {
	startAuthentication,
	startRegistration,
	type AuthenticationResponseJSON,
	type PublicKeyCredentialCreationOptionsJSON,
	type PublicKeyCredentialRequestOptionsJSON,
	type RegistrationResponseJSON,
} from '@simplewebauthn/browser';

export interface AuthUser {
	id: string;
	email: string;
	displayName: string;
}

export interface TokenResponse {
	accessToken: string;
	user: AuthUser;
	// refreshToken is NOT in the response — it arrives as an HttpOnly cookie
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		credentials: 'include', // always send HttpOnly cookies
		headers: {
			'Content-Type': 'application/json',
			...init?.headers,
		},
	});
	if (!response.ok) {
		throw new ApiError(response.status, `${response.status} ${response.statusText}`);
	}
	return response.json() as Promise<T>;
}

export async function getRegisterOptions(
	email: string,
	displayName: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
	return fetchJson('/api/auth/webauthn/register-options', {
		method: 'POST',
		body: JSON.stringify({ email, displayName }),
	});
}

export async function submitRegistration(
	registrationResponse: RegistrationResponseJSON,
): Promise<TokenResponse> {
	return fetchJson('/api/auth/webauthn/register', {
		method: 'POST',
		body: JSON.stringify(registrationResponse),
	});
}

export async function getLoginOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
	// No email — discoverable credentials; the browser presents the credential picker
	return fetchJson('/api/auth/webauthn/login-options', {
		method: 'POST',
		body: JSON.stringify({}),
	});
}

export async function submitLogin(
	authenticationResponse: AuthenticationResponseJSON,
): Promise<TokenResponse> {
	return fetchJson('/api/auth/webauthn/login', {
		method: 'POST',
		body: JSON.stringify(authenticationResponse),
	});
}

export async function refreshAccessToken(): Promise<TokenResponse> {
	// No body — the refresh token cookie is sent automatically by the browser
	return fetchJson('/api/auth/refresh', { method: 'POST', body: JSON.stringify({}) });
}

export async function logout(accessToken: string): Promise<void> {
	await fetch('/api/auth/logout', {
		method: 'POST',
		credentials: 'include',
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
}

// Convenience wrappers that run the full browser WebAuthn ceremony

export async function registerWithPasskey(
	email: string,
	displayName: string,
): Promise<TokenResponse> {
	const options = await getRegisterOptions(email, displayName);
	const registrationResponse = await startRegistration({ optionsJSON: options });
	return submitRegistration(registrationResponse);
}

export async function loginWithPasskey(): Promise<TokenResponse> {
	const options = await getLoginOptions();
	const authenticationResponse = await startAuthentication({ optionsJSON: options });
	return submitLogin(authenticationResponse);
}
