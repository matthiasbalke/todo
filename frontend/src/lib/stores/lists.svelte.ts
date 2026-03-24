import { mockLists, mockCategories } from '$lib/mock-data';
import type { List, Category } from '$lib/mock-data';

let lists = $state<List[]>([...mockLists]);
let categories = $state<Category[]>([...mockCategories]);

export function getLists() {
  return lists;
}

export function getList(id: string): List | undefined {
  return lists.find(l => l.id === id);
}

export function saveList(updated: List) {
  const idx = lists.findIndex(l => l.id === updated.id);
  if (idx >= 0) lists[idx] = updated;
  else lists.push(updated);
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
