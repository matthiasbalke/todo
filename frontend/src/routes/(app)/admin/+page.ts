import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getAdminSettings, getAdminStats, getAdminUsers } from '$lib/api/admin';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		await parent();
		const [settings, stats, users] = await Promise.all([
			getAdminSettings(fetch),
			getAdminStats(fetch),
			getAdminUsers(fetch),
		]);
		return { settings, stats, users };
	} catch {
		throw error(403, 'Admin access required');
	}
};
