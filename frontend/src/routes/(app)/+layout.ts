export const ssr = false;

import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { restoreSession } from '$lib/stores/auth.svelte';
import { loadLists } from '$lib/stores/lists.svelte';
import { loadPreferences } from '$lib/stores/preferences.svelte';
import { loadTodayCount } from '$lib/stores/today.svelte';

export async function load({ fetch }) {
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
	if (restoreStatus !== 'authenticated') {
		throw redirect(307, '/auth');
	}
	await Promise.all([loadLists(fetch), loadPreferences(fetch)]);
	await loadTodayCount(fetch);
}
