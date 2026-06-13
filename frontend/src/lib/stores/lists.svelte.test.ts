import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ListDto, ListSummaryDto } from '$lib/api/lists';

const mockCreateCategory = vi.fn<() => Promise<CategoryDto>>();
const mockGetLists = vi.fn<() => Promise<ListSummaryDto[]>>();
const mockUpdateList = vi.fn<() => Promise<ListDto>>();

vi.mock('$lib/api/lists', () => ({
	getLists: mockGetLists,
	createList: vi.fn(),
	updateList: mockUpdateList,
	deleteList: vi.fn(),
	getCategories: vi.fn(),
	createCategory: mockCreateCategory,
	updateCategory: vi.fn(),
	deleteCategory: vi.fn(),
	getListGroups: vi.fn().mockResolvedValue([]),
}));

function makeDto(id: string): CategoryDto {
	return {
		id,
		listId: 'list-1',
		name: 'Produce',
		color: null,
		sortOrder: 0,
		createdAt: '2026-01-01T00:00:00Z',
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
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
