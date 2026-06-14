import { redirect } from '@sveltejs/kit';
import { isAuthenticated, restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export async function load({ fetch }) {
	await restoreSession(fetch);
	if (isAuthenticated()) {
		throw redirect(307, '/lists');
	}
}
