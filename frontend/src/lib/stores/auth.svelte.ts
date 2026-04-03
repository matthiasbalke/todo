import { type AuthUser, refreshAccessToken } from '$lib/api/auth';

let currentUser = $state<AuthUser | null>(null);
let accessToken = $state<string | null>(null);
let tokenExpiresAt = $state<number | null>(null);

export function getCurrentUser(): AuthUser | null {
	return currentUser;
}

export function getAccessToken(): string | null {
	return accessToken;
}

export function isAuthenticated(): boolean {
	return currentUser !== null && accessToken !== null;
}

export function setSession(response: { accessToken: string; user: AuthUser }): void {
	accessToken = response.accessToken;
	currentUser = response.user;
	try {
		const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
		tokenExpiresAt = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
	} catch {
		tokenExpiresAt = null;
	}
}

export function clearSession(): void {
	accessToken = null;
	currentUser = null;
	tokenExpiresAt = null;
}

export function isTokenExpiredOrExpiring(bufferMs = 120_000): boolean {
	if (tokenExpiresAt === null) return false;
	return Date.now() >= tokenExpiresAt - bufferMs;
}

/**
 * Refreshes the access token if it is expired or expiring soon.
 * Returns true if the session is still valid after the call, false if it was cleared.
 */
export async function refreshIfExpired(): Promise<boolean> {
	if (!isAuthenticated()) return false;
	if (!isTokenExpiredOrExpiring()) return true;
	try {
		const response = await refreshAccessToken();
		setSession(response);
		return true;
	} catch {
		clearSession();
		return false;
	}
}

/**
 * Attempts a silent session restore using the refresh token cookie.
 * Called on app load; SSR-safe (no-ops on the server).
 */
export async function restoreSession(): Promise<void> {
	if (typeof window === 'undefined') return;
	if (isAuthenticated()) return;
	try {
		const response = await refreshAccessToken();
		setSession(response);
	} catch {
		// No valid refresh token — user is logged out; no action needed
	}
}
