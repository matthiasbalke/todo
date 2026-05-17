import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (!dev) {
		redirect(307, '/');
	}
};
