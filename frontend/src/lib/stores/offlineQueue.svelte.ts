import * as itemsApi from '$lib/api/items';

export interface QueuedMutation {
	id: string;
	type: 'toggleDone' | 'toggleStarred' | 'reorder';
	listId: string;
	itemId?: string;
	orderedIds?: string[];
	timestamp: number;
}

const STORAGE_KEY = 'offlineMutationQueue';

let queue = $state<QueuedMutation[]>(loadFromStorage());
let flushing = $state(false);

function loadFromStorage(): QueuedMutation[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
	} catch {
		return [];
	}
}

function saveToStorage(q: QueuedMutation[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
	} catch {
		// ignore storage errors
	}
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
	const entry: QueuedMutation = {
		...mutation,
		id: crypto.randomUUID(),
		timestamp: Date.now(),
	};
	queue = [...queue, entry];
	saveToStorage(queue);
}

export function hasPending(): boolean {
	return queue.length > 0;
}

export async function flushOfflineQueue(): Promise<Set<string>> {
	const affectedListIds = new Set<string>();
	if (flushing || queue.length === 0) return affectedListIds;
	flushing = true;
	try {
		const toProcess = [...queue];
		for (const mutation of toProcess) {
			try {
				if (mutation.type === 'toggleDone' && mutation.itemId) {
					await itemsApi.toggleItemDone(mutation.listId, mutation.itemId);
				} else if (mutation.type === 'toggleStarred' && mutation.itemId) {
					await itemsApi.toggleItemStarred(mutation.listId, mutation.itemId);
				} else if (mutation.type === 'reorder' && mutation.orderedIds) {
					await itemsApi.reorderItems(
						mutation.listId,
						mutation.orderedIds.map((id, idx) => ({ id, sortOrder: idx })),
					);
				}
				affectedListIds.add(mutation.listId);
				queue = queue.filter((m) => m.id !== mutation.id);
				saveToStorage(queue);
			} catch {
				// Stop processing on first failure; retry on next flush
				break;
			}
		}
	} finally {
		flushing = false;
	}
	return affectedListIds;
}
