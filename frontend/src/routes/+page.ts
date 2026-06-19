import { redirect } from '@sveltejs/kit';
import { isAuthenticated, restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export async function load({ fetch }) {
	await restoreSession(fetch);
	throw redirect(307, isAuthenticated() ? '/lists' : '/auth');
}
