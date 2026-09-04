import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemDto } from '$lib/api/items';

const mockCreateItem = vi.fn<() => Promise<ItemDto>>();
const mockUpdateItem = vi.fn();
const mockReorderItems = vi.fn();
const mockDeleteFinishedItems = vi.fn();

vi.mock('$lib/api/items', () => ({
	createItem: mockCreateItem,
	deleteFinishedItems: mockDeleteFinishedItems,
	getItems: vi.fn(),
	updateItem: mockUpdateItem,
	reorderItems: mockReorderItems,
}));

vi.mock('$lib/stores/offlineQueue.svelte', () => ({
	enqueue: vi.fn(),
}));

function makeDto(id: string, categoryId: string | null = null): ItemDto {
	return {
		id,
		listId: 'list-1',
		categoryId,
		title: 'Test item',
		notes: null,
		done: false,
		starred: false,
		dueDate: null,
		assignedUserIds: [],
		recurrenceRule: null,
		parentItemId: null,
		createdByUserId: 'user-1',
		updatedByUserId: 'user-1',
		sortOrder: 0,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
	};
}

function makeDoneDto(id: string, listId = 'list-1'): ItemDto {
	return {
		...makeDto(id),
		listId,
		done: true,
	};
}

function makeRichDto(id: string, categoryId: string | null = null): ItemDto {
	return {
		...makeDto(id, categoryId),
		title: `Title ${id}`,
		notes: `Notes ${id}`,
		starred: true,
		dueDate: '2026-02-03',
		assignedUserIds: ['user-1', 'user-2'],
		recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 },
		sortOrder: 7,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
});

async function getStore() {
	return import('$lib/stores/items.svelte');
}

describe('createItem', () => {
	it('adds the item to the store when SSE has not fired yet', async () => {
		const dto = makeDto('item-1');
		mockCreateItem.mockResolvedValue(dto);

		const { createItem, getItems } = await getStore();
		await createItem('list-1', { title: 'Test item' });

		expect(getItems()).toHaveLength(1);
		expect(getItems()[0].id).toBe('item-1');
	});

	it('should not add duplicate when SSE item.created arrives before createItem resolves', async () => {
		const dto = makeDto('item-1');

		// Deferred promise — lets us control when createItem API resolves
		let resolveCreate!: (value: ItemDto) => void;
		mockCreateItem.mockReturnValue(new Promise<ItemDto>((res) => { resolveCreate = res; }));

		const { createItem, saveItem, getItems } = await getStore();

		// Start createItem but don't await yet
		const createPromise = createItem('list-1', { title: 'Test item' });

		// Simulate SSE item.created arriving before HTTP response
		const { dtoToItem } = await getStore();
		saveItem(dtoToItem(dto));

		// Now resolve the HTTP response with the same item
		resolveCreate(dto);
		await createPromise;

		expect(getItems()).toHaveLength(1);
		expect(getItems()[0].id).toBe('item-1');
	});
});

describe('clearCategoryFromItems', () => {
	it('uncategorizes loaded items assigned to a deleted category', async () => {
		const { clearCategoryFromItems, dtoToItem, getItems, saveItem } = await getStore();
		saveItem(dtoToItem(makeDto('item-1', 'category-1')));
		saveItem(dtoToItem(makeDto('item-2', 'category-2')));
		saveItem(dtoToItem(makeDto('item-3', null)));

		clearCategoryFromItems('category-1');

		expect(getItems().find((item) => item.id === 'item-1')?.categoryId).toBeNull();
		expect(getItems().find((item) => item.id === 'item-2')?.categoryId).toBe('category-2');
		expect(getItems().find((item) => item.id === 'item-3')?.categoryId).toBeNull();
	});
});

describe('deleteFinishedItems', () => {
	it('removes checked items from the target list after the API succeeds', async () => {
		mockDeleteFinishedItems.mockResolvedValue(undefined);
		const { deleteFinishedItems, dtoToItem, getItems, saveItem } = await getStore();
		saveItem(dtoToItem(makeDoneDto('checked-1')));
		saveItem(dtoToItem(makeDto('unchecked-1')));
		saveItem(dtoToItem(makeDoneDto('other-list-checked', 'list-2')));

		await deleteFinishedItems('list-1');

		expect(mockDeleteFinishedItems).toHaveBeenCalledWith('list-1');
		expect(getItems().map((item) => item.id)).toEqual(['unchecked-1', 'other-list-checked']);
	});

	it('keeps local state when the API fails', async () => {
		mockDeleteFinishedItems.mockRejectedValue(new Error('boom'));
		const { deleteFinishedItems, dtoToItem, getItems, saveItem } = await getStore();
		saveItem(dtoToItem(makeDoneDto('checked-1')));
		saveItem(dtoToItem(makeDto('unchecked-1')));

		await expect(deleteFinishedItems('list-1')).rejects.toThrow('boom');

		expect(getItems().map((item) => item.id)).toEqual(['checked-1', 'unchecked-1']);
	});
});

describe('moveItemsToCategoryOptimistic', () => {
	it('moves an item to another category and persists the destination order', async () => {
		mockUpdateItem.mockResolvedValue(makeRichDto('item-1', 'category-2'));
		mockReorderItems.mockResolvedValue(undefined);
		const { dtoToItem, getItems, moveItemsToCategoryOptimistic, saveItem } = await getStore();
		saveItem(dtoToItem(makeRichDto('item-1', 'category-1')));
		saveItem(dtoToItem(makeDto('item-2', 'category-2')));

		await moveItemsToCategoryOptimistic('list-1', 'category-2', ['item-2', 'item-1']);

		expect(getItems().find((item) => item.id === 'item-1')).toMatchObject({
			categoryId: 'category-2',
			sortOrder: 1,
		});
		expect(mockUpdateItem).toHaveBeenCalledWith('list-1', 'item-1', {
			title: 'Title item-1',
			notes: 'Notes item-1',
			categoryId: 'category-2',
			dueDate: '2026-02-03',
			starred: true,
			recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 },
			assignedUserIds: ['user-1', 'user-2'],
			sortOrder: 1,
		});
		expect(mockReorderItems).toHaveBeenCalledWith('list-1', [
			{ id: 'item-2', sortOrder: 0 },
			{ id: 'item-1', sortOrder: 1 },
		]);
	});

	it('moves an item to uncategorized', async () => {
		mockUpdateItem.mockResolvedValue(makeDto('item-1', null));
		mockReorderItems.mockResolvedValue(undefined);
		const { dtoToItem, getItems, moveItemsToCategoryOptimistic, saveItem } = await getStore();
		saveItem(dtoToItem(makeDto('item-1', 'category-1')));

		await moveItemsToCategoryOptimistic('list-1', null, ['item-1']);

		expect(getItems().find((item) => item.id === 'item-1')?.categoryId).toBeNull();
		expect(mockUpdateItem).toHaveBeenCalledWith(
			'list-1',
			'item-1',
			expect.objectContaining({ categoryId: null }),
		);
		expect(mockReorderItems).toHaveBeenCalledWith('list-1', [{ id: 'item-1', sortOrder: 0 }]);
	});

	it('reverts optimistic changes when persistence fails', async () => {
		mockUpdateItem.mockRejectedValue(new Error('boom'));
		const { dtoToItem, getItems, moveItemsToCategoryOptimistic, saveItem } = await getStore();
		saveItem(dtoToItem(makeDto('item-1', 'category-1')));
		saveItem(dtoToItem(makeDto('item-2', 'category-2')));

		await expect(moveItemsToCategoryOptimistic('list-1', 'category-2', ['item-2', 'item-1'])).rejects.toThrow('boom');

		expect(getItems().find((item) => item.id === 'item-1')).toMatchObject({
			categoryId: 'category-1',
			sortOrder: 0,
		});
		expect(mockReorderItems).not.toHaveBeenCalled();
	});
});
