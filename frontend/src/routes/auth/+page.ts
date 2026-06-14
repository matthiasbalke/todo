import { redirect } from '@sveltejs/kit';
import { restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export async function load({ fetch }) {
	const sessionState = await restoreSession(fetch);
	if (sessionState === 'backend-unavailable') {
		throw redirect(307, '/');
	}
	if (sessionState === 'authenticated') {
		throw redirect(307, '/lists');
	}
}
