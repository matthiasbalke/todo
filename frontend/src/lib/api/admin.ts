import { authedFetch } from './authedClient';

export interface AdminSettings {
	registrationEnabled: boolean;
	email: EmailSettings;
}

export interface RegistrationSettings {
	registrationEnabled: boolean;
}

export type EmailConfigurationSource = 'DEPLOYMENT' | 'RUNTIME';
export type EmailEncryption = 'STARTTLS' | 'SSL_TLS';
export type PasswordAction = 'KEEP' | 'REPLACE' | 'CLEAR';

export interface EmailSettings {
	source: EmailConfigurationSource;
	enabled: boolean;
	authEnabled: boolean;
	host: string;
	port: number | null;
	protocol: string;
	encryption: EmailEncryption;
	username: string | null;
	passwordConfigured: boolean;
	from: string;
	fromName: string | null;
	publicBaseUrl: string;
	validationErrors: string[];
}

export interface UpdateEmailSettingsRequest {
	enabled: boolean;
	authEnabled: boolean;
	host: string;
	port: number | null;
	protocol: string;
	encryption: EmailEncryption;
	username: string | null;
	passwordAction: PasswordAction;
	password: string | null;
	from: string;
	fromName: string | null;
	publicBaseUrl: string;
}

export interface TestEmailResponse {
	status: 'ACCEPTED' | 'UNAVAILABLE' | 'FAILED';
	category: string | null;
	message: string | null;
	detail: string | null;
	hint: string | null;
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

export async function setRegistrationEnabled(registrationEnabled: boolean): Promise<RegistrationSettings> {
	return authedFetch('/api/admin/settings/registration', {
		method: 'PATCH',
		body: JSON.stringify({ registrationEnabled }),
	});
}

export async function updatePublicBaseUrl(publicBaseUrl: string): Promise<EmailSettings> {
	return authedFetch('/api/admin/settings/public-base-url', {
		method: 'PATCH',
		body: JSON.stringify({ publicBaseUrl }),
	});
}

export async function updateEmailSettings(req: UpdateEmailSettingsRequest): Promise<EmailSettings> {
	return authedFetch('/api/admin/settings/email', {
		method: 'PATCH',
		body: JSON.stringify(req),
	});
}

export async function resetEmailSettings(): Promise<EmailSettings> {
	return authedFetch('/api/admin/settings/email/reset', { method: 'POST' });
}

export async function testEmailSettings(recipient: string): Promise<TestEmailResponse> {
	return authedFetch('/api/admin/settings/email/test', {
		method: 'POST',
		body: JSON.stringify({ recipient }),
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
