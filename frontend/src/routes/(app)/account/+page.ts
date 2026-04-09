import { redirect, error } from '@sveltejs/kit';
import { getMe, getPasskeys } from '$lib/api/users';
import { ApiError } from '$lib/api/client';

export const ssr = false;

export async function load() {
	try {
		const [profile, passkeys] = await Promise.all([getMe(), getPasskeys()]);
		return { profile, passkeys };
	} catch (e) {
		if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
			throw redirect(307, '/auth');
		}
		throw error(500, 'Failed to load account data');
	}
}
