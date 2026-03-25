import { mockItems } from '$lib/mock-data';
import type { TodoItem } from '$lib/mock-data';

let items = $state<TodoItem[]>([...mockItems]);

export function getItems() {
  return items;
}

export function toggleDone(id: string) {
  const item = items.find(i => i.id === id);
  if (item) item.done = !item.done;
}

export function toggleStarred(id: string) {
  const item = items.find(i => i.id === id);
  if (item) item.starred = !item.starred;
}

export function saveItem(updated: TodoItem) {
  const idx = items.findIndex(i => i.id === updated.id);
  if (idx >= 0) {
    items[idx] = updated;
  } else {
    items = [...items, updated];
  }
}
