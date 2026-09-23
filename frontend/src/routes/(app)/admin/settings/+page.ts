import { error } from '@sveltejs/kit';
import { getAdminSettings } from '$lib/api/admin';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		await parent();
		return { settings: await getAdminSettings(fetch) };
	} catch {
		throw error(403, 'Admin access required');
	}
};
