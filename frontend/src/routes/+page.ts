import { redirect } from '@sveltejs/kit';
import { restoreSession } from '$lib/stores/auth.svelte';

export const ssr = false;

export async function load({ fetch }) {
	const sessionState = await restoreSession(fetch);
	if (sessionState === 'authenticated') {
		throw redirect(307, '/lists');
	}
	if (sessionState === 'unauthenticated') {
		throw redirect(307, '/auth');
	}

	return { startup: true };
}
