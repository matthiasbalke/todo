export type ListItemDefaults = {
  lastCategoryId: string | null;
};

const key = (listId: string) => `todo_list_item_defaults_${listId}`;

export function loadListItemDefaults(listId: string): ListItemDefaults | null {
  try {
    const raw = localStorage.getItem(key(listId));
    if (!raw) return null;
    return JSON.parse(raw) as ListItemDefaults;
  } catch {
    return null;
  }
}

export function saveListItemDefaults(listId: string, d: ListItemDefaults): void {
  try {
    localStorage.setItem(key(listId), JSON.stringify(d));
  } catch {
    // ignore (e.g. private browsing quota exceeded)
  }
}

export function deleteListItemDefaults(listId: string): void {
  try {
    localStorage.removeItem(key(listId));
  } catch {
    // ignore
  }
}
