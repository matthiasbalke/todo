import type { List, ListGroup, Category, SortField, SortDirection } from '$lib/mock-data';
import {
	getLists as apiGetLists,
	createList as apiCreateList,
	updateList as apiUpdateList,
	deleteList as apiDeleteList,
	duplicateList as apiDuplicateList,
	getCategories as apiGetCategories,
	createCategory as apiCreateCategory,
	updateCategory as apiUpdateCategory,
	deleteCategory as apiDeleteCategory,
	reorderCategories as apiReorderCategories,
	getListGroups as apiGetListGroups,
	createListGroup as apiCreateListGroup,
	renameListGroup as apiRenameListGroup,
	deleteListGroup as apiDeleteListGroup,
	reorderListGroup as apiReorderListGroup,
	reorderListGroups as apiReorderListGroups,
	assignListGroup as apiAssignListGroup,
	reorderListInGroup as apiReorderListInGroup,
	type CreateListRequest,
	type UpdateListRequest,
} from '$lib/api/lists';
import { clearCategoryFromItems } from '$lib/stores/items.svelte';

let lists = $state<List[]>([]);
let listGroups = $state<ListGroup[]>([]);
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

export function getListGroups(): ListGroup[] {
  return listGroups;
}

export function getList(id: string): List | undefined {
  return lists.find(l => l.id === id);
}

export async function loadLists(fetchFn: typeof fetch = fetch): Promise<void> {
  loading = true;
  try {
    const [dtos, groupDtos] = await Promise.all([apiGetLists(fetchFn), apiGetListGroups()]);
    lists = dtos.map(dto => ({
      id: dto.id,
      name: dto.name,
      emoji: dto.emoji,
      description: null,
      defaultSortField: 'MANUAL' as SortField,
      defaultSortDirection: 'ASC' as SortDirection,
      createdAt: dto.createdAt,
      groupId: dto.groupId,
      sortOrderInGroup: dto.sortOrderInGroup,
      role: dto.role,
    }));
    listGroups = groupDtos.map(dto => ({
      id: dto.id,
      userId: dto.userId,
      name: dto.name,
      sortOrder: dto.sortOrder,
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
    groupId: null,
    sortOrderInGroup: 0,
    role: dto.role,
  };
  lists.push(list);
  return list;
}

// ─── List Group operations ────────────────────────────────────────────────────

export async function createListGroup(name: string): Promise<ListGroup> {
  const dto = await apiCreateListGroup({ name });
  const group: ListGroup = { id: dto.id, userId: dto.userId, name: dto.name, sortOrder: dto.sortOrder, createdAt: dto.createdAt };
  listGroups.push(group);
  return group;
}

export async function renameListGroup(id: string, name: string): Promise<void> {
  const dto = await apiRenameListGroup(id, { name });
  const idx = listGroups.findIndex(g => g.id === id);
  if (idx >= 0) listGroups[idx] = { ...listGroups[idx], name: dto.name };
}

export async function deleteListGroup(id: string): Promise<void> {
  await apiDeleteListGroup(id);
  const idx = listGroups.findIndex(g => g.id === id);
  if (idx >= 0) listGroups.splice(idx, 1);
  // Clear groupId on all affected lists in store
  lists.forEach((l, i) => { if (l.groupId === id) lists[i] = { ...l, groupId: null }; });
}

export async function reorderListGroup(id: string, sortOrder: number): Promise<void> {
  await apiReorderListGroup(id, { sortOrder });
  const idx = listGroups.findIndex(g => g.id === id);
  if (idx >= 0) listGroups[idx] = { ...listGroups[idx], sortOrder };
}

function dtoToListGroup(dto: { id: string; userId: string; name: string; sortOrder: number; createdAt: string }): ListGroup {
  return { id: dto.id, userId: dto.userId, name: dto.name, sortOrder: dto.sortOrder, createdAt: dto.createdAt };
}

export async function reorderListGroupsOptimistic(groupIds: string[]): Promise<void> {
  const previous = listGroups.slice();
  const byId = new Map(listGroups.map(group => [group.id, group]));
  const requested = new Set(groupIds);
  if (requested.size !== groupIds.length || listGroups.length !== groupIds.length || groupIds.some(id => !byId.has(id))) {
    throw new Error('Group order must include every group exactly once');
  }

  listGroups = groupIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index }));

  try {
    const dtos = await apiReorderListGroups({ groupIds });
    listGroups = dtos.map(dtoToListGroup);
  } catch (e) {
    listGroups = previous;
    throw e;
  }
}

export async function assignListGroup(listId: string, groupId: string | null): Promise<void> {
  await apiAssignListGroup(listId, { groupId });
  const idx = lists.findIndex(l => l.id === listId);
  if (idx >= 0) lists[idx] = { ...lists[idx], groupId };
}

export async function reorderListInGroup(listId: string, sortOrder: number): Promise<void> {
  await apiReorderListInGroup(listId, { sortOrder });
  const idx = lists.findIndex(l => l.id === listId);
  if (idx >= 0) lists[idx] = { ...lists[idx], sortOrderInGroup: sortOrder };
}

export async function updateList(id: string, req: UpdateListRequest): Promise<List> {
  const dto = await apiUpdateList(id, req);
  const existing = lists.find(l => l.id === id);
  const list: List = {
    id: dto.id,
    name: dto.name,
    emoji: dto.emoji,
    description: dto.description,
    defaultSortField: dto.defaultSortField as SortField,
    defaultSortDirection: dto.defaultSortDirection as SortDirection,
    createdAt: dto.createdAt,
    groupId: existing?.groupId ?? null,
    sortOrderInGroup: existing?.sortOrderInGroup ?? 0,
    role: dto.role ?? existing?.role ?? 'OWNER',
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

export async function duplicateList(id: string): Promise<List> {
  const dto = await apiDuplicateList(id);
  const source = lists.find(l => l.id === id);
  const list: List = {
    id: dto.id,
    name: dto.name,
    emoji: dto.emoji,
    description: dto.description,
    defaultSortField: dto.defaultSortField as SortField,
    defaultSortDirection: dto.defaultSortDirection as SortDirection,
    createdAt: dto.createdAt,
    groupId: source?.groupId ?? null,
    sortOrderInGroup: source?.sortOrderInGroup ?? 0,
    role: dto.role,
  };
  lists.push(list);
  return list;
}

export function getCategoriesForList(listId: string): Category[] {
  return categories.filter(c => c.listId === listId).sort((a, b) => a.sortOrder - b.sortOrder);
}

function dtoToCategory(dto: { id: string; listId: string; name: string; color: string | null; sortOrder: number }): Category {
  return { id: dto.id, listId: dto.listId, name: dto.name, color: dto.color, sortOrder: dto.sortOrder };
}

export async function loadCategoriesForList(listId: string): Promise<void> {
  const dtos = await apiGetCategories(listId);
  const loaded: Category[] = dtos.map(dtoToCategory);
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
    if (idx >= 0) categories[idx] = dtoToCategory(dto);
  } else {
    const dto = await apiCreateCategory(updated.listId, {
      name: updated.name,
      color: updated.color,
      sortOrder: updated.sortOrder,
    });
    upsertCategoryInStore(dtoToCategory(dto));
  }
}

export async function reorderCategoriesOptimistic(listId: string, categoryIds: string[]): Promise<void> {
  const previous = categories.slice();
  const listCategories = categories.filter(c => c.listId === listId);
  const byId = new Map(listCategories.map(c => [c.id, c]));
  const requested = new Set(categoryIds);
  if (requested.size !== categoryIds.length || listCategories.length !== categoryIds.length || categoryIds.some(id => !byId.has(id))) {
    throw new Error('Category order must include every category exactly once');
  }

  const reordered = categoryIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index }));
  categories = [...categories.filter(c => c.listId !== listId), ...reordered];

  try {
    const dtos = await apiReorderCategories(listId, { categoryIds });
    const persisted = dtos.map(dtoToCategory);
    categories = [...categories.filter(c => c.listId !== listId), ...persisted];
  } catch (e) {
    categories = previous;
    throw e;
  }
}

export async function deleteCategory(listId: string, id: string): Promise<void> {
  await apiDeleteCategory(listId, id);
  removeCategoryFromStore(id);
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
  clearCategoryFromItems(categoryId);
}
