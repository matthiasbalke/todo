import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { getCurrentUser, restoreSession } from '$lib/stores/auth.svelte';
import { EMAIL_VERIFICATION_ROUTE, SETUP_ROUTE, STARTUP_ROUTE, VERIFIED_LANDING_ROUTE } from '$lib/routes';

export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	if (!(await checkHealth(fetch))) {
		throw redirect(307, STARTUP_ROUTE);
	}
	try {
		const setup = await getSetupStatus(fetch);
		if (setup.setupRequired) {
			throw redirect(307, SETUP_ROUTE);
		}
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'status' in error && 'location' in error) throw error;
	}

	const restoreStatus = await restoreSession(fetch);
	if (restoreStatus === 'unavailable') {
		throw redirect(307, STARTUP_ROUTE);
	}
	if (restoreStatus === 'authenticated') {
		const user = getCurrentUser();
		throw redirect(307, user?.emailVerified === false ? EMAIL_VERIFICATION_ROUTE : VERIFIED_LANDING_ROUTE);
	}
	return { restoreStatus };
};
