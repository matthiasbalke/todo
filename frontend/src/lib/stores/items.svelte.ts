import type { ItemDto } from '$lib/api/items';
import * as itemsApi from '$lib/api/items';
import type { TodoItem, IntervalUnit } from '$lib/mock-data';

let items = $state<TodoItem[]>([]);

function dtoToItem(dto: ItemDto): TodoItem {
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
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
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
	items = [...items, item];
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
		// Revert optimistic update
		if (idx >= 0) items[idx] = { ...items[idx], done: !items[idx].done };
		throw e;
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
		// Revert optimistic update
		if (idx >= 0) items[idx] = { ...items[idx], starred: !items[idx].starred };
		throw e;
	}
}

export function saveItem(item: TodoItem) {
	const idx = items.findIndex(i => i.id === item.id);
	if (idx >= 0) {
		items[idx] = item;
	} else {
		items = [...items, item];
	}
}
