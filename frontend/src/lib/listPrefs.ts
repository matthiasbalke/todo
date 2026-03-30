import type { SortField, SortDirection } from '$lib/mock-data';

export type ListPrefs = {
  sortField: SortField;
  sortDirection: SortDirection;
  starredOnly: boolean;
  hideFuture: boolean;
  hideUndated: boolean;
  hideDone?: boolean;
};

const key = (listId: string) => `todo_list_prefs_${listId}`;

export function loadListPrefs(listId: string): ListPrefs | null {
  try {
    const raw = localStorage.getItem(key(listId));
    if (!raw) return null;
    return JSON.parse(raw) as ListPrefs;
  } catch {
    return null;
  }
}

export function saveListPrefs(listId: string, prefs: ListPrefs): void {
  try {
    localStorage.setItem(key(listId), JSON.stringify(prefs));
  } catch {
    // ignore (e.g. private browsing quota exceeded)
  }
}

export function deleteListPrefs(listId: string): void {
  try {
    localStorage.removeItem(key(listId));
  } catch {
    // ignore
  }
}
