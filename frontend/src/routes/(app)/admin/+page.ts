import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	await parent();
	throw redirect(307, '/admin/settings');
};
