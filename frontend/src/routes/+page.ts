import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { checkHealth } from '$lib/api/health';
import { restoreSession } from '$lib/stores/auth.svelte';

export async function load({ fetch }) {
	if (!browser) {
		return { startup: true };
	}
	if (!(await checkHealth(fetch))) {
		return { startup: true };
	}

	const restoreStatus = await restoreSession(fetch);
	if (restoreStatus === 'authenticated') {
		throw redirect(307, '/lists');
	}
	if (restoreStatus === 'unauthenticated') {
		throw redirect(307, '/auth');
	}
	return { startup: true };
}
