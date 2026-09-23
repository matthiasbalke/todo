import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { getEmailVerificationState } from '$lib/api/verification';
import { getCurrentUser, restoreSession } from '$lib/stores/auth.svelte';
import { AUTH_ROUTE, SETUP_ROUTE, STARTUP_ROUTE, VERIFIED_LANDING_ROUTE } from '$lib/routes';

export const ssr = false;

export const load: PageLoad = async ({ fetch, url }) => {
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
	if (restoreStatus !== 'authenticated') {
		throw redirect(307, AUTH_ROUTE);
	}

	const state = await getEmailVerificationState(fetch);
	const user = getCurrentUser();
	if (user?.emailVerified !== false && !state.pendingEmailChange) {
		throw redirect(307, VERIFIED_LANDING_ROUTE);
	}

	return {
		state,
		validationToken: url.searchParams.get('validation_token') ?? '',
	};
};
