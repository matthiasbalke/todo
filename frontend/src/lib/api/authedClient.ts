import { fetchJson, ApiError } from './client';
import { getAccessToken, setSession, clearSession } from '$lib/stores/auth.svelte';
import { refreshAccessToken } from './auth';

export async function authedFetch<T>(
	url: string,
	init?: RequestInit,
	fetchFn: typeof fetch = fetch,
): Promise<T> {
	const token = getAccessToken();
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
		} catch {
			clearSession();
			throw new ApiError(401, 'Session expired', 'SESSION_EXPIRED');
		}
	}
}
