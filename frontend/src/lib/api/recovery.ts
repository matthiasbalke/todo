import {
	startRegistration,
	type PublicKeyCredentialCreationOptionsJSON,
	type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { fetchJson } from './client';

export interface RecoveryInfo {
	email: string;
	displayName: string;
	expiresAt: string;
}

export interface RecoveryComplete {
	success: boolean;
}

export async function getRecoveryInfo(token: string, fetchFn: typeof fetch = fetch): Promise<RecoveryInfo> {
	return fetchJson<RecoveryInfo>(`/api/auth/recovery/${encodeURIComponent(token)}`, { method: 'GET' }, fetchFn);
}

export async function getRecoveryOptions(token: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
	return fetchJson(`/api/auth/recovery/${encodeURIComponent(token)}/register-options`, {
		method: 'POST',
		body: JSON.stringify({}),
	});
}

export async function submitRecoveryRegistration(
	token: string,
	registrationResponse: RegistrationResponseJSON,
	label?: string,
): Promise<RecoveryComplete> {
	return fetchJson(`/api/auth/recovery/${encodeURIComponent(token)}/register`, {
		method: 'POST',
		body: JSON.stringify({ credential: registrationResponse, label: label || null }),
	});
}

export async function recoverWithPasskey(token: string, label?: string): Promise<RecoveryComplete> {
	const options = await getRecoveryOptions(token);
	const registrationResponse = await startRegistration({ optionsJSON: options });
	return submitRecoveryRegistration(token, registrationResponse, label);
}
