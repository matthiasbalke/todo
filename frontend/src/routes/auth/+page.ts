import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	if (!(await checkHealth(fetch))) {
		throw redirect(307, '/');
	}
	try {
		const setup = await getSetupStatus(fetch);
		if (setup.setupRequired) {
			throw redirect(307, '/setup');
		}
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'status' in error && 'location' in error) throw error;
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
