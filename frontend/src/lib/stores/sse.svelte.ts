import { openSseConnection } from '$lib/api/sse';
import { getAccessToken } from '$lib/stores/auth.svelte';
import { dtoToItem, saveItem, removeItemFromStore, loadItemsForList } from '$lib/stores/items.svelte';
import { upsertCategoryInStore, removeCategoryFromStore } from '$lib/stores/lists.svelte';
import type { Category } from '$lib/mock-data';

let connection = $state<EventSource | null>(null);
let currentListId = $state<string | null>(null);
let refetchTimer: ReturnType<typeof setTimeout> | null = null;

export function connectToList(listId: string): void {
	if (currentListId === listId && connection !== null) return;
	disconnectFromList();

	const token = getAccessToken();
	if (!token) return;

	const es = openSseConnection(listId, token);
	connection = es;
	currentListId = listId;

	es.addEventListener('item.created', (e: MessageEvent) => {
		try {
			saveItem(dtoToItem(JSON.parse(e.data)));
		} catch { /* ignore parse errors */ }
	});

	es.addEventListener('item.updated', (e: MessageEvent) => {
		try {
			saveItem(dtoToItem(JSON.parse(e.data)));
		} catch { /* ignore parse errors */ }
	});

	es.addEventListener('item.deleted', (e: MessageEvent) => {
		try {
			removeItemFromStore(JSON.parse(e.data).itemId);
		} catch { /* ignore parse errors */ }
	});

	es.addEventListener('category.created', (e: MessageEvent) => {
		try {
			upsertCategoryInStore(JSON.parse(e.data) as Category);
		} catch { /* ignore parse errors */ }
	});

	es.addEventListener('category.updated', (e: MessageEvent) => {
		try {
			upsertCategoryInStore(JSON.parse(e.data) as Category);
		} catch { /* ignore parse errors */ }
	});

	es.addEventListener('category.deleted', (e: MessageEvent) => {
		try {
			removeCategoryFromStore(JSON.parse(e.data).categoryId);
		} catch { /* ignore parse errors */ }
	});

	// member.* events don't need local store patches — MembersDialog fetches on open

	es.onerror = () => {
		// EventSource auto-reconnects; debounce a full item refetch to cover any gaps
		if (refetchTimer) clearTimeout(refetchTimer);
		refetchTimer = setTimeout(() => {
			if (currentListId) loadItemsForList(currentListId).catch(() => { /* best effort */ });
		}, 500);
	};
}

export function disconnectFromList(): void {
	if (refetchTimer) {
		clearTimeout(refetchTimer);
		refetchTimer = null;
	}
	connection?.close();
	connection = null;
	currentListId = null;
}
