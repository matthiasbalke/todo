export const ssr = false;

import { redirect } from '@sveltejs/kit';
import { restoreSession } from '$lib/stores/auth.svelte';
import { loadLists } from '$lib/stores/lists.svelte';
import { loadPreferences } from '$lib/stores/preferences.svelte';
import { loadTodayCount } from '$lib/stores/today.svelte';

export async function load({ fetch }) {
	const sessionState = await restoreSession(fetch);
	if (sessionState === 'backend-unavailable') {
		throw redirect(307, '/');
	}
	if (sessionState !== 'authenticated') {
		throw redirect(307, '/auth');
	}
	await Promise.all([loadLists(fetch), loadPreferences(fetch)]);
	await loadTodayCount(fetch);
}
