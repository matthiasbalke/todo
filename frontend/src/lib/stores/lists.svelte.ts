import { mockLists, mockCategories } from '$lib/mock-data';
import type { List, Category } from '$lib/mock-data';

let lists = $state<List[]>([...mockLists]);

export function getLists() {
  return lists;
}

export function getList(id: string): List | undefined {
  return lists.find(l => l.id === id);
}

export function getCategoriesForList(listId: string): Category[] {
  return mockCategories.filter(c => c.listId === listId);
}
