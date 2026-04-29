import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const BACKEND_URL = env.BACKEND_URL ?? 'http://localhost:8080';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	if (pathname.startsWith('/api/') || pathname.startsWith('/actuator/')) {
		const target = BACKEND_URL + pathname + search;

		const forwardHeaders = new Headers(event.request.headers);
		// Strip hop-by-hop headers — undici (Node native fetch) rejects them
		for (const h of ['host', 'connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade']) {
			forwardHeaders.delete(h);
		}

		const init: RequestInit & { duplex?: string } = {
			method: event.request.method,
			headers: forwardHeaders,
		};
		if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
			init.body = event.request.body;
			init.duplex = 'half';
		}

		return fetch(target, init);
	}

	return resolve(event);
};
