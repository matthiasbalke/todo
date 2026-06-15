import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isAuthenticated, restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	const restoreStatus = await restoreSession(fetch);
	if (restoreStatus === 'authenticated' || isAuthenticated()) {
		throw redirect(307, '/lists');
	}
	return { restoreStatus };
};
