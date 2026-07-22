export type ListGroupState = {
  collapsed: Record<string, boolean>;
};

export const UNGROUPED_LIST_GROUP_STATE_KEY = '__ungrouped__';

const STORAGE_KEY = 'todo_list_group_state';

export function loadListGroupState(): ListGroupState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListGroupState;
  } catch {
    return null;
  }
}

export function saveListGroupState(state: ListGroupState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore (e.g. private browsing quota exceeded)
  }
}

export function deleteListGroupState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
