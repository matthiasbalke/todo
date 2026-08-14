import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ListDto, ListGroupDto, ListSummaryDto } from '$lib/api/lists';

const mockCreateCategory = vi.fn<() => Promise<CategoryDto>>();
const mockGetLists = vi.fn<() => Promise<ListSummaryDto[]>>();
const mockUpdateList = vi.fn<() => Promise<ListDto>>();
const mockDuplicateList = vi.fn<() => Promise<ListDto>>();
const mockDeleteCategory = vi.fn<() => Promise<void>>();
const mockReorderCategories = vi.fn<() => Promise<CategoryDto[]>>();
const mockGetListGroups = vi.fn<() => Promise<ListGroupDto[]>>();
const mockReorderListGroups = vi.fn<() => Promise<ListGroupDto[]>>();

vi.mock('$lib/api/lists', () => ({
	getLists: mockGetLists,
	createList: vi.fn(),
	updateList: mockUpdateList,
	deleteList: vi.fn(),
	duplicateList: mockDuplicateList,
	getCategories: vi.fn(),
	createCategory: mockCreateCategory,
	updateCategory: vi.fn(),
	deleteCategory: mockDeleteCategory,
	reorderCategories: mockReorderCategories,
	getListGroups: mockGetListGroups,
	createListGroup: vi.fn(),
	renameListGroup: vi.fn(),
	deleteListGroup: vi.fn(),
	reorderListGroup: vi.fn(),
	reorderListGroups: mockReorderListGroups,
	assignListGroup: vi.fn(),
	reorderListInGroup: vi.fn(),
}));

function makeDto(id: string, sortOrder = 0, name = 'Produce'): CategoryDto {
	return {
		id,
		listId: 'list-1',
		name,
		color: null,
		sortOrder,
		createdAt: '2026-01-01T00:00:00Z',
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
	mockGetLists.mockResolvedValue([]);
	mockGetListGroups.mockResolvedValue([]);
});

async function getStore() {
	return import('$lib/stores/lists.svelte');
}

describe('saveCategory (create path)', () => {
	it('adds the category when SSE has not fired yet', async () => {
		const dto = makeDto('cat-1');
		mockCreateCategory.mockResolvedValue(dto);

		const { saveCategory, getCategoriesForList } = await getStore();
		await saveCategory({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 });

		expect(getCategoriesForList('list-1')).toHaveLength(1);
		expect(getCategoriesForList('list-1')[0].id).toBe('cat-1');
	});

	it('should not add duplicate when SSE category.created arrives before saveCategory resolves', async () => {
		const dto = makeDto('cat-1');

		let resolveCreate!: (value: CategoryDto) => void;
		mockCreateCategory.mockReturnValue(new Promise<CategoryDto>((res) => { resolveCreate = res; }));

		const { saveCategory, upsertCategoryInStore, getCategoriesForList } = await getStore();

		// Start saveCategory (create path — id not in store yet) but don't await
		const savePromise = saveCategory({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 });

		// Simulate SSE category.created arriving before HTTP response
		upsertCategoryInStore({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 });

		// Resolve the HTTP response with the same category
		resolveCreate(dto);
		await savePromise;

		expect(getCategoriesForList('list-1')).toHaveLength(1);
		expect(getCategoriesForList('list-1')[0].id).toBe('cat-1');
	});
});

describe('deleteCategory', () => {
	it('removes the category and uncategorizes loaded items assigned to it', async () => {
		mockCreateCategory.mockImplementation((async () => makeDto('cat-1')) as typeof mockCreateCategory);
		mockDeleteCategory.mockResolvedValue(undefined);

		const { saveCategory, deleteCategory, getCategoriesForList } = await getStore();
		const { dtoToItem, getItems, saveItem } = await import('$lib/stores/items.svelte');

		await saveCategory({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 });
		saveItem(dtoToItem({
			id: 'item-1',
			listId: 'list-1',
			categoryId: 'cat-1',
			title: 'Apples',
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
		}));

		await deleteCategory('list-1', 'cat-1');

		expect(getCategoriesForList('list-1')).toHaveLength(0);
		expect(getItems()[0].categoryId).toBeNull();
	});
});

describe('reorderCategoriesOptimistic', () => {
	it('optimistically reorders categories and applies normalized response order', async () => {
		mockCreateCategory
			.mockResolvedValueOnce(makeDto('cat-1', 5, 'Produce'))
			.mockResolvedValueOnce(makeDto('cat-2', 9, 'Dairy'));
		mockReorderCategories.mockResolvedValue([
			makeDto('cat-2', 0, 'Dairy'),
			makeDto('cat-1', 1, 'Produce'),
		]);

		const { saveCategory, reorderCategoriesOptimistic, getCategoriesForList } = await getStore();
		await saveCategory({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 5 });
		await saveCategory({ id: 'cat-2', listId: 'list-1', name: 'Dairy', color: null, sortOrder: 9 });

		const promise = reorderCategoriesOptimistic('list-1', ['cat-2', 'cat-1']);
		expect(getCategoriesForList('list-1').map(category => category.id)).toEqual(['cat-2', 'cat-1']);
		await promise;

		expect(mockReorderCategories).toHaveBeenCalledWith('list-1', { categoryIds: ['cat-2', 'cat-1'] });
		expect(getCategoriesForList('list-1').map(category => [category.id, category.sortOrder])).toEqual([
			['cat-2', 0],
			['cat-1', 1],
		]);
	});

	it('rolls back optimistic category order when persistence fails', async () => {
		mockCreateCategory
			.mockResolvedValueOnce(makeDto('cat-1', 0, 'Produce'))
			.mockResolvedValueOnce(makeDto('cat-2', 1, 'Dairy'));
		mockReorderCategories.mockRejectedValue(new Error('network down'));

		const { saveCategory, reorderCategoriesOptimistic, getCategoriesForList } = await getStore();
		await saveCategory({ id: 'cat-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 });
		await saveCategory({ id: 'cat-2', listId: 'list-1', name: 'Dairy', color: null, sortOrder: 1 });

		await expect(reorderCategoriesOptimistic('list-1', ['cat-2', 'cat-1'])).rejects.toThrow('network down');

		expect(getCategoriesForList('list-1').map(category => category.id)).toEqual(['cat-1', 'cat-2']);
	});
});

describe('reorderListGroupsOptimistic', () => {
	function makeGroupDto(id: string, sortOrder: number, name = id): ListGroupDto {
		return {
			id,
			userId: 'user-1',
			name,
			sortOrder,
			createdAt: '2026-01-01T00:00:00Z',
		};
	}

	it('optimistically reorders list groups and applies normalized response order', async () => {
		mockGetListGroups.mockResolvedValue([
			makeGroupDto('group-home', 5, 'Home'),
			makeGroupDto('group-work', 9, 'Work'),
		]);
		mockReorderListGroups.mockResolvedValue([
			makeGroupDto('group-work', 0, 'Work'),
			makeGroupDto('group-home', 1, 'Home'),
		]);

		const { loadLists, reorderListGroupsOptimistic, getListGroups } = await getStore();
		await loadLists();

		const promise = reorderListGroupsOptimistic(['group-work', 'group-home']);
		expect(getListGroups().map(group => group.id)).toEqual(['group-work', 'group-home']);
		await promise;

		expect(mockReorderListGroups).toHaveBeenCalledWith({ groupIds: ['group-work', 'group-home'] });
		expect(getListGroups().map(group => [group.id, group.sortOrder])).toEqual([
			['group-work', 0],
			['group-home', 1],
		]);
	});

	it('rolls back optimistic list group order when persistence fails', async () => {
		mockGetListGroups.mockResolvedValue([
			makeGroupDto('group-home', 0, 'Home'),
			makeGroupDto('group-work', 1, 'Work'),
		]);
		mockReorderListGroups.mockRejectedValue(new Error('network down'));

		const { loadLists, reorderListGroupsOptimistic, getListGroups } = await getStore();
		await loadLists();

		await expect(reorderListGroupsOptimistic(['group-work', 'group-home'])).rejects.toThrow('network down');

		expect(getListGroups().map(group => group.id)).toEqual(['group-home', 'group-work']);
	});
});

describe('list role storage', () => {
	it('retains roles when loading list summaries', async () => {
		mockGetLists.mockResolvedValue([
			{
				id: 'list-1',
				name: 'Shared',
				emoji: null,
				createdAt: '2026-01-01T00:00:00Z',
				groupId: null,
				sortOrderInGroup: 0,
				role: 'VIEWER',
			},
		]);

		const { loadLists, getList } = await getStore();
		await loadLists();

		expect(getList('list-1')?.role).toBe('VIEWER');
	});

	it('keeps the response role and personal grouping when a list is updated', async () => {
		mockGetLists.mockResolvedValue([
			{
				id: 'list-1',
				name: 'Shared',
				emoji: null,
				createdAt: '2026-01-01T00:00:00Z',
				groupId: 'group-1',
				sortOrderInGroup: 3,
				role: 'OWNER',
			},
		]);
		mockUpdateList.mockResolvedValue({
			id: 'list-1',
			name: 'Renamed',
			emoji: null,
			description: null,
			defaultSortField: 'MANUAL',
			defaultSortDirection: 'ASC',
			createdAt: '2026-01-01T00:00:00Z',
			role: 'OWNER',
		});

		const { loadLists, updateList, getList } = await getStore();
		await loadLists();
		await updateList('list-1', { name: 'Renamed' });

		expect(getList('list-1')).toMatchObject({
			role: 'OWNER',
			groupId: 'group-1',
			sortOrderInGroup: 3,
		});
	});
});

describe('duplicateList', () => {
	it('calls the API, inserts the returned list, and keeps source grouping', async () => {
		mockGetLists.mockResolvedValue([
			{
				id: 'list-1',
				name: 'Groceries',
				emoji: '🛒',
				createdAt: '2026-01-01T00:00:00Z',
				groupId: 'group-1',
				sortOrderInGroup: 2,
				role: 'OWNER',
			},
		]);
		mockDuplicateList.mockResolvedValue({
			id: 'list-2',
			name: 'Groceries (1)',
			emoji: '🛒',
			description: null,
			defaultSortField: 'MANUAL',
			defaultSortDirection: 'ASC',
			createdAt: '2026-01-02T00:00:00Z',
			role: 'OWNER',
		});

		const { loadLists, duplicateList, getList } = await getStore();
		await loadLists();
		const duplicated = await duplicateList('list-1');

		expect(mockDuplicateList).toHaveBeenCalledWith('list-1');
		expect(duplicated).toMatchObject({
			id: 'list-2',
			name: 'Groceries (1)',
			groupId: 'group-1',
			sortOrderInGroup: 2,
			role: 'OWNER',
		});
		expect(getList('list-2')).toEqual(duplicated);
	});
});
