import type { TodoItem, Category, SortField, SortDirection, RecurrenceRule } from './mock-data';

export interface Filters {
  starredOnly: boolean;
  hideFuture: boolean;
  hideUndated: boolean;
}

export function applyFilters(items: TodoItem[], filters: Filters): TodoItem[] {
  return items.filter(item => {
    if (filters.starredOnly && !item.starred) return false;
    if (filters.hideFuture && item.dueDate) {
      const due = new Date(item.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due > today) return false;
    }
    if (filters.hideUndated && !item.dueDate) return false;
    return true;
  });
}

export function applySort(items: TodoItem[], field: SortField, direction: SortDirection): TodoItem[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'ALPHA':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'DUE_DATE': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db;
        break;
      }
      case 'STARRED':
        cmp = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        break;
      case 'CREATED':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'MANUAL':
        cmp = a.sortOrder - b.sortOrder;
        break;
    }
    return direction === 'DESC' ? -cmp : cmp;
  });
  return sorted;
}

export function groupByCategory(
  items: TodoItem[],
  categories: Category[]
): Map<string | null, { category: Category | null; items: TodoItem[] }> {
  const result = new Map<string | null, { category: Category | null; items: TodoItem[] }>();

  // Add categories in sortOrder order
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const cat of sortedCategories) {
    result.set(cat.id, { category: cat, items: [] });
  }
  // Add null group last
  result.set(null, { category: null, items: [] });

  for (const item of items) {
    const key = item.categoryId;
    if (result.has(key)) {
      result.get(key)!.items.push(item);
    } else {
      result.get(null)!.items.push(item);
    }
  }

  // Remove empty groups
  for (const [key, value] of result) {
    if (value.items.length === 0) result.delete(key);
  }

  return result;
}

function midnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatDueDate(dueDate: string): string {
  const date = midnight(new Date(dueDate));
  const today = midnight(new Date());

  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isDueDateOverdue(dueDate: string): boolean {
  return midnight(new Date(dueDate)) < midnight(new Date());
}

export function isDueDateToday(dueDate: string): boolean {
  return midnight(new Date(dueDate)).getTime() === midnight(new Date()).getTime();
}

export function recurrenceRuleToHuman(rule: RecurrenceRule): string {
  const { intervalUnit, intervalValue } = rule;
  const unitMap: Record<string, [string, string]> = {
    DAYS: ['day', 'days'],
    WEEKS: ['week', 'weeks'],
    MONTHS: ['month', 'months'],
    YEARS: ['year', 'years']
  };
  const [singular, plural] = unitMap[intervalUnit] ?? [intervalUnit.toLowerCase(), intervalUnit.toLowerCase()];
  if (intervalValue === 1) return `Every ${singular}`;
  return `Every ${intervalValue} ${plural}`;
}
