import { error } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/stores/auth.svelte';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, url }) => {
	await parent();
	if (!getCurrentUser()?.admin) throw error(403, 'Admin access required');
	return { activeAdminPath: url.pathname };
};
