import {
	startAuthentication,
	startRegistration,
	type AuthenticationResponseJSON,
	type PublicKeyCredentialCreationOptionsJSON,
	type PublicKeyCredentialRequestOptionsJSON,
	type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { fetchJson } from './client';
export { ApiError } from './client';

export interface AuthConfig {
	registrationEnabled: boolean;
}

export interface AuthUser {
	id: string;
	email: string;
	displayName: string;
	admin?: boolean;
}

export interface TokenResponse {
	accessToken: string;
	user: AuthUser;
	// refreshToken is NOT in the response — it arrives as an HttpOnly cookie
}

export async function getAuthConfig(): Promise<AuthConfig> {
	return fetchJson<AuthConfig>('/api/auth/config', { method: 'GET' });
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
	label?: string,
): Promise<TokenResponse> {
	return fetchJson('/api/auth/webauthn/register', {
		method: 'POST',
		body: JSON.stringify({ credential: registrationResponse, label: label || null }),
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

export async function refreshAccessToken(fetchFn: typeof fetch = fetch): Promise<TokenResponse> {
	// No body — the refresh token cookie is sent automatically by the browser
	return fetchJson('/api/auth/refresh', { method: 'POST', body: JSON.stringify({}) }, fetchFn);
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
	label?: string,
): Promise<TokenResponse> {
	const options = await getRegisterOptions(email, displayName);
	const registrationResponse = await startRegistration({ optionsJSON: options });
	return submitRegistration(registrationResponse, label);
}

export async function loginWithPasskey(): Promise<TokenResponse> {
	const options = await getLoginOptions();
	const authenticationResponse = await startAuthentication({ optionsJSON: options });
	return submitLogin(authenticationResponse);
}
