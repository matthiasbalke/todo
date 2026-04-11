import { redirect, error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getMe, getPasskeys } from '$lib/api/users';
import { ApiError } from '$lib/api/client';

export const ssr = false;

export const load: PageLoad = async ({ parent, fetch }) => {
	await parent(); // wait for layout load (restoreSession) before making authed API calls
	try {
		const [profile, passkeys] = await Promise.all([getMe(fetch), getPasskeys(fetch)]);
		return { profile, passkeys };
	} catch (e) {
		if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
			throw redirect(307, '/auth');
		}
		throw error(500, 'Failed to load account data');
	}
}
