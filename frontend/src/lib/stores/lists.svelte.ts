import { mockCategories } from '$lib/mock-data';
import type { List, Category, SortField, SortDirection } from '$lib/mock-data';
import {
	getLists as apiGetLists,
	createList as apiCreateList,
	updateList as apiUpdateList,
	deleteList as apiDeleteList,
	type CreateListRequest,
	type UpdateListRequest,
} from '$lib/api/lists';

let lists = $state<List[]>([]);
let categories = $state<Category[]>([...mockCategories]);
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

export async function loadLists(): Promise<void> {
  loading = true;
  try {
    const dtos = await apiGetLists();
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

export function saveCategory(updated: Category) {
  const idx = categories.findIndex(c => c.id === updated.id);
  if (idx >= 0) categories[idx] = updated;
  else categories.push(updated);
}

export function deleteCategory(id: string) {
  const idx = categories.findIndex(c => c.id === id);
  if (idx >= 0) categories.splice(idx, 1);
}
