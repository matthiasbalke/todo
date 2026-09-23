import { error } from '@sveltejs/kit';
import { getAdminStats, getAdminUsers } from '$lib/api/admin';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		await parent();
		const [stats, users] = await Promise.all([
			getAdminStats(fetch),
			getAdminUsers(fetch),
		]);
		return { stats, users };
	} catch {
		throw error(403, 'Admin access required');
	}
};
