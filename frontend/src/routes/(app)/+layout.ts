export const ssr = false;

import { redirect } from '@sveltejs/kit';
import { isAuthenticated, restoreSession } from '$lib/stores/auth.svelte';

export async function load() {
	await restoreSession();
	if (!isAuthenticated()) {
		throw redirect(307, '/auth');
	}
}
