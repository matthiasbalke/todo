import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	if (!(await checkHealth(fetch))) {
		throw redirect(307, '/');
	}

	const restoreStatus = await restoreSession(fetch);
	if (restoreStatus === 'unavailable') {
		throw redirect(307, '/');
	}
	if (restoreStatus === 'authenticated') {
		throw redirect(307, '/lists');
	}
	return { restoreStatus };
};
