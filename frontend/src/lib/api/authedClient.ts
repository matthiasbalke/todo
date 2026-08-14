import { untrack } from 'svelte';
import { fetchJson, ApiError } from './client';
import { getAccessToken, setSession, clearSession } from '$lib/stores/auth.svelte';
import { refreshAccessToken } from './auth';

function isBlockedAccountError(error: ApiError): boolean {
	return error.status === 403 && (error.code === 'ACCOUNT_BLOCKED' || /account .*blocked|blocked .*account/i.test(error.message));
}

function blockedAccountError(): ApiError {
	return new ApiError(403, 'Your account is blocked. Please contact the admin.', 'ACCOUNT_BLOCKED');
}

export async function authedFetch<T>(
	url: string,
	init?: RequestInit,
	fetchFn: typeof fetch = fetch,
): Promise<T> {
	let token = untrack(() => getAccessToken());
	if (!token) {
		try {
			const refreshed = await refreshAccessToken(fetchFn);
			setSession(refreshed);
			token = refreshed.accessToken;
		} catch (refreshError) {
			clearSession();
			if (refreshError instanceof ApiError && isBlockedAccountError(refreshError)) {
				throw blockedAccountError();
			}
			throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
		}
	}
	try {
		return await fetchJson<T>(
			url,
			{
				...init,
				headers: {
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					...init?.headers,
				},
			},
			fetchFn,
		);
	} catch (e) {
		if (e instanceof ApiError && isBlockedAccountError(e)) {
			clearSession();
			throw blockedAccountError();
		}
		if (!(e instanceof ApiError) || e.status !== 401) throw e;
		// Attempt one token refresh and retry
		try {
			const refreshed = await refreshAccessToken(fetchFn);
			setSession(refreshed);
			return await fetchJson<T>(
				url,
				{
					...init,
					headers: {
						Authorization: `Bearer ${refreshed.accessToken}`,
						...init?.headers,
					},
				},
				fetchFn,
			);
		} catch (refreshError) {
			clearSession();
			if (refreshError instanceof ApiError && isBlockedAccountError(refreshError)) {
				throw blockedAccountError();
			}
			throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
		}
	}
}
