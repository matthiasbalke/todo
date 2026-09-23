import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { getCurrentUser, restoreSession } from '$lib/stores/auth.svelte';
import { AUTH_ROUTE, EMAIL_VERIFICATION_ROUTE, SETUP_ROUTE, VERIFIED_LANDING_ROUTE } from '$lib/routes';

export async function load({ fetch }) {
	if (!browser) {
		return { startup: true };
	}
	if (!(await checkHealth(fetch))) {
		return { startup: true };
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
	if (restoreStatus === 'authenticated') {
		const user = getCurrentUser();
		throw redirect(307, user?.emailVerified === false ? EMAIL_VERIFICATION_ROUTE : VERIFIED_LANDING_ROUTE);
	}
	if (restoreStatus === 'unauthenticated') {
		throw redirect(307, AUTH_ROUTE);
	}
	return { startup: true };
}
