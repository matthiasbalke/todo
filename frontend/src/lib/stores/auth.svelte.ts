import { type AuthUser, refreshAccessToken, ApiError } from '$lib/api/auth';

export type SessionRestoreState = 'authenticated' | 'unauthenticated' | 'backend-unavailable';

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

export function updateCurrentUser(partial: Partial<AuthUser>): void {
	if (currentUser) currentUser = { ...currentUser, ...partial };
}

/**
 * Attempts a silent session restore using the refresh token cookie.
 * Called on app load; SSR-safe (no-ops on the server).
 */
function isBackendUnavailableError(error: unknown): boolean {
	if (error instanceof TypeError) return true;
	if (error instanceof ApiError) {
		return error.status === 502 || error.status === 503 || error.status === 504;
	}
	return false;
}

export async function restoreSession(fetchFn: typeof fetch = fetch): Promise<SessionRestoreState> {
	if (typeof window === 'undefined') return 'backend-unavailable';
	if (isAuthenticated()) return 'authenticated';
	try {
		const response = await refreshAccessToken(fetchFn);
		setSession(response);
		return 'authenticated';
	} catch (error) {
		if (isBackendUnavailableError(error)) return 'backend-unavailable';
		// No valid refresh token — user is logged out; no action needed
		return 'unauthenticated';
	}
}
