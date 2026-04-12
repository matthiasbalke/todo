/**
 * Opens an SSE connection to a list's event stream.
 * Uses a `token` query parameter because EventSource cannot set custom headers.
 * On reconnect, the browser automatically sends `Last-Event-ID` so missed events
 * are replayed from the server's in-memory buffer.
 */
export function openSseConnection(listId: string, token: string): EventSource {
	const url = new URL(`/api/lists/${listId}/events`, window.location.origin);
	url.searchParams.set('token', token);
	return new EventSource(url.toString());
}
