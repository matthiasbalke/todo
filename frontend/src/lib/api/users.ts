import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { authedFetch } from './authedClient';

export interface UserProfileDto {
	id: string;
	email: string;
	displayName: string;
}

export interface PasskeyDto {
	id: string;
	label: string | null;
	createdAt: string;
}

export interface DeletionPreviewDto {
	listsToDelete: { id: string; name: string }[];
	listsToLeave: { id: string; name: string }[];
}

export async function getMe(fetchFn: typeof fetch = fetch): Promise<UserProfileDto> {
	return authedFetch('/api/users/me', undefined, fetchFn);
}

export async function updateMe(req: { displayName: string; email: string }): Promise<UserProfileDto> {
	return authedFetch('/api/users/me', {
		method: 'PUT',
		body: JSON.stringify(req),
	});
}

export async function getPasskeys(fetchFn: typeof fetch = fetch): Promise<PasskeyDto[]> {
	return authedFetch('/api/users/me/passkeys', undefined, fetchFn);
}

export async function getAddPasskeyOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
	return authedFetch('/api/users/me/passkeys/register-options', {
		method: 'POST',
		body: JSON.stringify({}),
	});
}

export async function submitAddPasskey(
	credential: RegistrationResponseJSON,
	label?: string,
): Promise<PasskeyDto> {
	return authedFetch('/api/users/me/passkeys', {
		method: 'POST',
		body: JSON.stringify({ credential, label }),
	});
}

export async function deletePasskey(id: string): Promise<void> {
	return authedFetch(`/api/users/me/passkeys/${id}`, { method: 'DELETE' });
}

export async function getDeletionPreview(): Promise<DeletionPreviewDto> {
	return authedFetch('/api/users/me/deletion-preview');
}

export async function deleteAccount(): Promise<void> {
	return authedFetch('/api/users/me', { method: 'DELETE' });
}
