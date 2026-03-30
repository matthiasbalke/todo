export type ListCategoryState = {
  collapsed: Record<string, boolean>;
  doneCollapsed: Record<string, boolean>;
};

const key = (listId: string) => `todo_list_category_state_${listId}`;

export function loadListCategoryState(listId: string): ListCategoryState | null {
  try {
    const raw = localStorage.getItem(key(listId));
    if (!raw) return null;
    return JSON.parse(raw) as ListCategoryState;
  } catch {
    return null;
  }
}

export function saveListCategoryState(listId: string, state: ListCategoryState): void {
  try {
    localStorage.setItem(key(listId), JSON.stringify(state));
  } catch {
    // ignore (e.g. private browsing quota exceeded)
  }
}

export function deleteListCategoryState(listId: string): void {
  try {
    localStorage.removeItem(key(listId));
  } catch {
    // ignore
  }
}
