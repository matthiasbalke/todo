import { authedFetch } from './authedClient';

export interface RecurrenceRuleDto {
	intervalUnit: string;
	intervalValue: number;
}

export interface ItemDto {
	id: string;
	listId: string;
	categoryId: string | null;
	title: string;
	notes: string | null;
	done: boolean;
	starred: boolean;
	dueDate: string | null; // ISO date string "YYYY-MM-DD"
	recurrenceRule: RecurrenceRuleDto | null;
	parentItemId: string | null;
	createdByUserId: string | null;
	updatedByUserId: string | null;
	assignedUserIds: string[];
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateItemRequest {
	title: string;
	notes?: string | null;
	categoryId?: string | null;
	dueDate?: string | null;
	starred?: boolean;
	recurrenceRule?: RecurrenceRuleDto | null;
	assignedUserIds?: string[];
	sortOrder?: number;
}

export interface UpdateItemRequest {
	title: string;
	notes?: string | null;
	categoryId?: string | null;
	dueDate?: string | null;
	starred?: boolean;
	recurrenceRule?: RecurrenceRuleDto | null;
	assignedUserIds?: string[];
	sortOrder?: number;
}


export function getItems(listId: string): Promise<ItemDto[]> {
	return authedFetch(`/api/lists/${listId}/items`);
}

export function getItem(listId: string, itemId: string): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}`);
}

export function createItem(listId: string, req: CreateItemRequest): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items`, {
		method: 'POST',
		body: JSON.stringify(req),
	});
}

export function updateItem(listId: string, itemId: string, req: UpdateItemRequest): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}`, {
		method: 'PUT',
		body: JSON.stringify(req),
	});
}

export function deleteItem(listId: string, itemId: string): Promise<void> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' });
}

export function deleteFinishedItems(listId: string): Promise<void> {
	return authedFetch(`/api/lists/${listId}/items/finished`, { method: 'DELETE' });
}

export function toggleItemDone(listId: string, itemId: string): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}/done`, { method: 'PATCH' });
}

export function toggleItemStarred(listId: string, itemId: string): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}/starred`, { method: 'PATCH' });
}

export function updateItemOrder(listId: string, itemId: string, sortOrder: number): Promise<ItemDto> {
	return authedFetch(`/api/lists/${listId}/items/${itemId}/order`, {
		method: 'PATCH',
		body: JSON.stringify({ sortOrder }),
	});
}

export interface ReorderEntry { id: string; sortOrder: number; }

export function reorderItems(listId: string, entries: ReorderEntry[]): Promise<void> {
	return authedFetch(`/api/lists/${listId}/items/reorder`, {
		method: 'POST',
		body: JSON.stringify({ items: entries }),
	});
}
