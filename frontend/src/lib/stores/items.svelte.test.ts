import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemDto } from '$lib/api/items';

const mockCreateItem = vi.fn<() => Promise<ItemDto>>();

vi.mock('$lib/api/items', () => ({
	createItem: mockCreateItem,
	getItems: vi.fn(),
}));

vi.mock('$lib/stores/offlineQueue.svelte', () => ({
	enqueue: vi.fn(),
}));

function makeDto(id: string): ItemDto {
	return {
		id,
		listId: 'list-1',
		categoryId: null,
		title: 'Test item',
		notes: null,
		done: false,
		starred: false,
		dueDate: null,
		assignedUserIds: [],
		recurrenceRule: null,
		parentItemId: null,
		createdByUserId: 'user-1',
		sortOrder: 0,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
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
