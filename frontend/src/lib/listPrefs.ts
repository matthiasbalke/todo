import type { SortField, SortDirection } from '$lib/mock-data';
import { normalizeAssigneeFilters, type AssigneeFilterCriterion } from '$lib/utils';

export type ListPrefs = {
  sortField: SortField;
  sortDirection: SortDirection;
  starredOnly: boolean;
  hideFuture: boolean;
  hideUndated: boolean;
  hideDone?: boolean;
  assigneeFilters?: AssigneeFilterCriterion[];
};

type PersistedListPrefs = Omit<ListPrefs, 'assigneeFilters'> & {
  assigneeFilters?: unknown;
  assigneeFilter?: unknown;
};

const key = (listId: string) => `todo_list_prefs_${listId}`;

export function loadListPrefs(listId: string): ListPrefs | null {
  try {
    const raw = localStorage.getItem(key(listId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedListPrefs;
    const assigneeFilters = normalizeAssigneeFilters(parsed.assigneeFilters ?? parsed.assigneeFilter);
    const { assigneeFilter: _legacyAssigneeFilter, ...prefs } = parsed;
    return { ...prefs, assigneeFilters } as ListPrefs;
  } catch {
    return null;
  }
}

export function saveListPrefs(listId: string, prefs: ListPrefs): void {
  try {
    localStorage.setItem(key(listId), JSON.stringify({
      ...prefs,
      assigneeFilters: normalizeAssigneeFilters(prefs.assigneeFilters),
    }));
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
