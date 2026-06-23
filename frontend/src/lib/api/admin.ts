import { authedFetch } from './authedClient';

export interface AdminSettings {
	registrationEnabled: boolean;
}

export interface AdminStats {
	users: number;
	admins: number;
	blockedUsers: number;
	lists: number;
	todoItems: number;
}

export interface AdminUser {
	id: string;
	email: string;
	displayName: string;
	admin: boolean;
	blocked: boolean;
	blockedAt: string | null;
	passkeyCount: number;
	createdAt: string;
}

export interface RecoveryLink {
	tokenId: string;
	url: string;
	expiresAt: string;
}

export async function getAdminSettings(fetchFn: typeof fetch = fetch): Promise<AdminSettings> {
	return authedFetch('/api/admin/settings', undefined, fetchFn);
}

export async function setRegistrationEnabled(registrationEnabled: boolean): Promise<AdminSettings> {
	return authedFetch('/api/admin/settings/registration', {
		method: 'PATCH',
		body: JSON.stringify({ registrationEnabled }),
	});
}

export async function getAdminStats(fetchFn: typeof fetch = fetch): Promise<AdminStats> {
	return authedFetch('/api/admin/stats', undefined, fetchFn);
}

export async function getAdminUsers(fetchFn: typeof fetch = fetch): Promise<AdminUser[]> {
	return authedFetch('/api/admin/users', undefined, fetchFn);
}

export async function updateAdminUser(
	id: string,
	req: { displayName: string; email: string },
): Promise<AdminUser> {
	return authedFetch(`/api/admin/users/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(req),
	});
}

export async function updateUserAdmin(id: string, admin: boolean): Promise<AdminUser> {
	return authedFetch(`/api/admin/users/${id}/admin`, {
		method: 'PATCH',
		body: JSON.stringify({ admin }),
	});
}

export async function updateUserBlocked(id: string, blocked: boolean): Promise<AdminUser> {
	return authedFetch(`/api/admin/users/${id}/blocked`, {
		method: 'PATCH',
		body: JSON.stringify({ blocked }),
	});
}

export async function createRecoveryLink(id: string): Promise<RecoveryLink> {
	return authedFetch(`/api/admin/users/${id}/recovery-links`, { method: 'POST' });
}
