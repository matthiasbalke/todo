import type { ItemDto } from '$lib/api/items';
import * as itemsApi from '$lib/api/items';
import type { TodoItem, IntervalUnit } from '$lib/mock-data';
import { enqueue } from '$lib/stores/offlineQueue.svelte';

let items = $state<TodoItem[]>([]);

export function dtoToItem(dto: ItemDto): TodoItem {
	return {
		id: dto.id,
		listId: dto.listId,
		categoryId: dto.categoryId,
		title: dto.title,
		notes: dto.notes,
		done: dto.done,
		starred: dto.starred,
		dueDate: dto.dueDate,
		assignedUserIds: dto.assignedUserIds,
		recurrenceRule: dto.recurrenceRule
			? { intervalUnit: dto.recurrenceRule.intervalUnit as IntervalUnit, intervalValue: dto.recurrenceRule.intervalValue }
			: null,
		parentItemId: dto.parentItemId,
		createdByUserId: dto.createdByUserId,
		updatedByUserId: dto.updatedByUserId,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt,
	};
}

export function getItems() {
	return items;
}

export async function loadItemsForList(listId: string): Promise<void> {
	const dtos = await itemsApi.getItems(listId);
	// Replace items for this list, keep items from other lists
	const other = items.filter(i => i.listId !== listId);
	items = [...other, ...dtos.map(dtoToItem)];
}

export async function createItem(listId: string, req: itemsApi.CreateItemRequest): Promise<TodoItem> {
	const dto = await itemsApi.createItem(listId, req);
	const item = dtoToItem(dto);
	saveItem(item);
	return item;
}

export async function updateItem(listId: string, itemId: string, req: itemsApi.UpdateItemRequest): Promise<TodoItem> {
	const dto = await itemsApi.updateItem(listId, itemId, req);
	const updated = dtoToItem(dto);
	items = items.map(i => i.id === itemId ? updated : i);
	return updated;
}

export async function deleteItem(listId: string, itemId: string): Promise<void> {
	await itemsApi.deleteItem(listId, itemId);
	items = items.filter(i => i.id !== itemId);
}

export async function toggleDone(listId: string, itemId: string): Promise<void> {
	// Optimistic update
	const idx = items.findIndex(i => i.id === itemId);
	if (idx >= 0) items[idx] = { ...items[idx], done: !items[idx].done };

	try {
		const dto = await itemsApi.toggleItemDone(listId, itemId);
		const updated = dtoToItem(dto);
		// Server may have created a new recurrence item — reload all items for this list
		await loadItemsForList(listId);
		// Ensure the toggled item reflects server state
		items = items.map(i => i.id === itemId ? updated : i);
	} catch (e) {
		if (isNetworkError(e)) {
			enqueue({ type: 'toggleDone', listId, itemId });
		} else {
			// Revert optimistic update on non-network errors
			if (idx >= 0) items[idx] = { ...items[idx], done: !items[idx].done };
			throw e;
		}
	}
}

export async function toggleStarred(listId: string, itemId: string): Promise<void> {
	// Optimistic update
	const idx = items.findIndex(i => i.id === itemId);
	if (idx >= 0) items[idx] = { ...items[idx], starred: !items[idx].starred };

	try {
		const dto = await itemsApi.toggleItemStarred(listId, itemId);
		const updated = dtoToItem(dto);
		items = items.map(i => i.id === itemId ? updated : i);
	} catch (e) {
		if (isNetworkError(e)) {
			enqueue({ type: 'toggleStarred', listId, itemId });
		} else {
			// Revert optimistic update on non-network errors
			if (idx >= 0) items[idx] = { ...items[idx], starred: !items[idx].starred };
			throw e;
		}
	}
}

export async function reorderItemsOptimistic(listId: string, orderedIds: string[]): Promise<void> {
	const snapshot = items.map(i => ({ ...i }));
	orderedIds.forEach((id, idx) => {
		const i = items.findIndex(x => x.id === id);
		if (i >= 0) items[i] = { ...items[i], sortOrder: idx };
	});
	try {
		await itemsApi.reorderItems(listId, orderedIds.map((id, idx) => ({ id, sortOrder: idx })));
	} catch (e) {
		if (isNetworkError(e)) {
			enqueue({ type: 'reorder', listId, orderedIds });
		} else {
			items = snapshot;
			throw e;
		}
	}
}

export async function moveItemsToCategoryOptimistic(
	listId: string,
	categoryId: string | null,
	orderedIds: string[],
): Promise<void> {
	const snapshot = items.map(i => ({ ...i }));
	const itemsById = new Map(items.map(item => [item.id, item]));
	const movedItems = orderedIds
		.map((id, idx) => ({ item: itemsById.get(id), sortOrder: idx }))
		.filter((entry): entry is { item: TodoItem; sortOrder: number } => Boolean(entry.item));
	const categoryChanges = movedItems.filter(({ item }) => item.categoryId !== categoryId);

	movedItems.forEach(({ item, sortOrder }) => {
		const index = items.findIndex(entry => entry.id === item.id);
		if (index >= 0) items[index] = { ...items[index], categoryId, sortOrder };
	});

	try {
		for (const { item, sortOrder } of categoryChanges) {
			await itemsApi.updateItem(listId, item.id, {
				title: item.title,
				notes: item.notes,
				categoryId,
				dueDate: item.dueDate,
				starred: item.starred,
				recurrenceRule: item.recurrenceRule,
				assignedUserIds: item.assignedUserIds,
				sortOrder,
			});
		}
		await itemsApi.reorderItems(listId, orderedIds.map((id, idx) => ({ id, sortOrder: idx })));
	} catch (e) {
		items = snapshot;
		throw e;
	}
}

function isNetworkError(e: unknown): boolean {
	return !navigator.onLine || (e instanceof TypeError && e.message.includes('fetch'));
}

export function saveItem(item: TodoItem) {
	const idx = items.findIndex(i => i.id === item.id);
	if (idx >= 0) {
		items[idx] = item;
	} else {
		items = [...items, item];
	}
}

export function removeItemFromStore(itemId: string) {
	items = items.filter(i => i.id !== itemId);
}

export function clearCategoryFromItems(categoryId: string) {
	items = items.map(i => i.categoryId === categoryId ? { ...i, categoryId: null } : i);
}
