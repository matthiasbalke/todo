import {
	startRegistration,
	type PublicKeyCredentialCreationOptionsJSON,
	type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { fetchJson } from './client';
import type { TokenResponse } from './auth';

export interface SetupStatus {
	setupRequired: boolean;
}

export async function getSetupStatus(fetchFn: typeof fetch = fetch): Promise<SetupStatus> {
	return fetchJson<SetupStatus>('/api/setup', { method: 'GET' }, fetchFn);
}

export async function getSetupOptions(
	email: string,
	displayName: string,
	setupSecret: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
	return fetchJson('/api/setup/webauthn/register-options', {
		method: 'POST',
		body: JSON.stringify({ email, displayName, setupSecret }),
	});
}

export async function submitSetupRegistration(
	registrationResponse: RegistrationResponseJSON,
	setupSecret: string,
	label?: string,
): Promise<TokenResponse> {
	return fetchJson('/api/setup/webauthn/register', {
		method: 'POST',
		body: JSON.stringify({ credential: registrationResponse, setupSecret, label: label || null }),
	});
}

export async function setupAdminWithPasskey(
	email: string,
	displayName: string,
	setupSecret: string,
	label?: string,
): Promise<TokenResponse> {
	const options = await getSetupOptions(email, displayName, setupSecret);
	const registrationResponse = await startRegistration({ optionsJSON: options });
	return submitSetupRegistration(registrationResponse, setupSecret, label);
}
