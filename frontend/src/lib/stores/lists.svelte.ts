import type { List, Category, SortField, SortDirection } from '$lib/mock-data';
import {
	getLists as apiGetLists,
	createList as apiCreateList,
	updateList as apiUpdateList,
	deleteList as apiDeleteList,
	getCategories as apiGetCategories,
	createCategory as apiCreateCategory,
	updateCategory as apiUpdateCategory,
	deleteCategory as apiDeleteCategory,
	type CreateListRequest,
	type UpdateListRequest,
} from '$lib/api/lists';

let lists = $state<List[]>([]);
let categories = $state<Category[]>([]);
let hideDoneMap = $state<Map<string, boolean>>(new Map());
let loading = $state(false);

export function isLoading(): boolean {
  return loading;
}

export function isHideDone(listId: string): boolean {
  return hideDoneMap.get(listId) ?? false;
}

export function setHideDone(listId: string, value: boolean): void {
  hideDoneMap = new Map(hideDoneMap).set(listId, value);
}

export function getLists(): List[] {
  return lists;
}

export function getList(id: string): List | undefined {
  return lists.find(l => l.id === id);
}

export async function loadLists(fetchFn: typeof fetch = fetch): Promise<void> {
  loading = true;
  try {
    const dtos = await apiGetLists(fetchFn);
    lists = dtos.map(dto => ({
      id: dto.id,
      name: dto.name,
      emoji: dto.emoji,
      description: null,
      defaultSortField: 'MANUAL' as SortField,
      defaultSortDirection: 'ASC' as SortDirection,
      createdAt: dto.createdAt,
    }));
  } finally {
    loading = false;
  }
}

export async function createList(req: CreateListRequest): Promise<List> {
  const dto = await apiCreateList(req);
  const list: List = {
    id: dto.id,
    name: dto.name,
    emoji: dto.emoji,
    description: dto.description,
    defaultSortField: dto.defaultSortField as SortField,
    defaultSortDirection: dto.defaultSortDirection as SortDirection,
    createdAt: dto.createdAt,
  };
  lists.push(list);
  return list;
}

export async function updateList(id: string, req: UpdateListRequest): Promise<List> {
  const dto = await apiUpdateList(id, req);
  const list: List = {
    id: dto.id,
    name: dto.name,
    emoji: dto.emoji,
    description: dto.description,
    defaultSortField: dto.defaultSortField as SortField,
    defaultSortDirection: dto.defaultSortDirection as SortDirection,
    createdAt: dto.createdAt,
  };
  const idx = lists.findIndex(l => l.id === id);
  if (idx >= 0) lists[idx] = list;
  return list;
}

export async function deleteList(id: string): Promise<void> {
  await apiDeleteList(id);
  const idx = lists.findIndex(l => l.id === id);
  if (idx >= 0) lists.splice(idx, 1);
}

export function getCategoriesForList(listId: string): Category[] {
  return categories.filter(c => c.listId === listId);
}

export async function loadCategoriesForList(listId: string): Promise<void> {
  const dtos = await apiGetCategories(listId);
  const loaded: Category[] = dtos.map(dto => ({
    id: dto.id,
    listId: dto.listId,
    name: dto.name,
    color: dto.color,
    sortOrder: dto.sortOrder,
  }));
  // Replace all categories for this list with fresh data from the API
  const others = categories.filter(c => c.listId !== listId);
  categories = [...others, ...loaded];
}

export async function saveCategory(updated: Category): Promise<void> {
  const existing = categories.find(c => c.id === updated.id);
  if (existing) {
    const dto = await apiUpdateCategory(updated.listId, updated.id, {
      name: updated.name,
      color: updated.color,
      sortOrder: updated.sortOrder,
    });
    const idx = categories.findIndex(c => c.id === updated.id);
    if (idx >= 0) categories[idx] = { id: dto.id, listId: dto.listId, name: dto.name, color: dto.color, sortOrder: dto.sortOrder };
  } else {
    const dto = await apiCreateCategory(updated.listId, {
      name: updated.name,
      color: updated.color,
      sortOrder: updated.sortOrder,
    });
    upsertCategoryInStore({ id: dto.id, listId: dto.listId, name: dto.name, color: dto.color, sortOrder: dto.sortOrder });
  }
}

export async function deleteCategory(listId: string, id: string): Promise<void> {
  await apiDeleteCategory(listId, id);
  const idx = categories.findIndex(c => c.id === id);
  if (idx >= 0) categories.splice(idx, 1);
}

export function upsertCategoryInStore(category: Category): void {
  const idx = categories.findIndex(c => c.id === category.id);
  if (idx >= 0) {
    categories[idx] = category;
  } else {
    categories = [...categories, category];
  }
}

export function removeCategoryFromStore(categoryId: string): void {
  categories = categories.filter(c => c.id !== categoryId);
}
