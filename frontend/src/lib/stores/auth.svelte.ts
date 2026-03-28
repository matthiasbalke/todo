import { type AuthUser, refreshAccessToken } from '$lib/api/auth';

let currentUser = $state<AuthUser | null>(null);
let accessToken = $state<string | null>(null);

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
}

export function clearSession(): void {
	accessToken = null;
	currentUser = null;
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
