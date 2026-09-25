import { afterEach, describe, it, expect, vi } from 'vitest';
import { recurrenceRuleToHuman, formatDueDate, isDueDateOverdue, isDueDateToday, applyFilters, applySort, groupByCategory } from './utils';
import type { Category, TodoItem } from './mock-data';
import type { Filters } from './utils';
import { addDaysToDateOnly, localIsoDate } from './dateOnly';

afterEach(() => {
  vi.useRealTimers();
});

describe('recurrenceRuleToHuman', () => {
  it('formats weekly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'WEEKS', intervalValue: 1 })).toBe('Every week'));
  it('formats bi-weekly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'WEEKS', intervalValue: 2 })).toBe('Every 2 weeks'));
  it('formats daily', () => expect(recurrenceRuleToHuman({ intervalUnit: 'DAYS', intervalValue: 1 })).toBe('Every day'));
  it('formats monthly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'MONTHS', intervalValue: 3 })).toBe('Every 3 months'));
});

describe('applyFilters — assigneeFilter', () => {
  const base: Omit<TodoItem, 'assignedUserIds'> = {
    id: '1', listId: 'l1', title: 'Test', starred: false, done: false,
    createdAt: '2024-01-01T00:00:00Z', sortOrder: 0,
    categoryId: null, dueDate: null, notes: null, recurrenceRule: null, parentItemId: null,
    createdByUserId: null,
    updatedByUserId: null,
    updatedAt: '2024-01-01T00:00:00Z',
  };
  const noAssignees: TodoItem = { ...base, id: 'a', assignedUserIds: [] };
  const assignedToMe: TodoItem = { ...base, id: 'b', assignedUserIds: ['user1'] };
  const assignedToOther: TodoItem = { ...base, id: 'c', assignedUserIds: ['user2'] };
  const assignedToMeAndOther: TodoItem = { ...base, id: 'd', assignedUserIds: ['user1', 'user2'] };

  const items = [noAssignees, assignedToMe, assignedToOther, assignedToMeAndOther];
  const baseFilters: Filters = { starredOnly: false, hideFuture: false, hideUndated: false, assigneeFilters: [] };

  it("'all' returns all items regardless of assignment", () => {
    expect(applyFilters(items, { ...baseFilters, assigneeFilters: [] }, 'user1')).toHaveLength(4);
  });

  it("'none' returns only unassigned items", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['none'] }, 'user1');
    expect(result).toEqual([noAssignees]);
  });

  it("'me' returns items that include currentUserId", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['me'] }, 'user1');
    expect(result.map(i => i.id)).toEqual(['b', 'd']);
  });

  it("'me' with no currentUserId returns no items", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['me'] });
    expect(result).toHaveLength(0);
  });

  it("'others' returns items assigned but not to current user", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['others'] }, 'user1');
    expect(result).toEqual([assignedToOther]);
  });

  it("'others' excludes items where current user is one of multiple assignees", () => {
    const result = applyFilters([assignedToMeAndOther], { ...baseFilters, assigneeFilters: ['others'] }, 'user1');
    expect(result).toHaveLength(0);
  });

  it("'none' plus 'me' returns unassigned and current-user items", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['none', 'me'] }, 'user1');
    expect(result.map(i => i.id)).toEqual(['a', 'b', 'd']);
  });

  it('normalizes all selected assignee criteria to all-assignee matching', () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilters: ['none', 'me', 'others'] }, 'user1');
    expect(result).toEqual(items);
  });

  it('narrows combined assignment criteria with other filters', () => {
    const result = applyFilters(
      [
        { ...noAssignees, starred: true },
        { ...assignedToMe, starred: false },
        { ...assignedToOther, starred: true },
      ],
      { ...baseFilters, starredOnly: true, assigneeFilters: ['none', 'me'] },
      'user1'
    );

    expect(result).toEqual([{ ...noAssignees, starred: true }]);
  });
});

describe('date-only due date behavior', () => {
  const baseItem: Omit<TodoItem, 'id' | 'title' | 'dueDate'> = {
    listId: 'l1',
    categoryId: null,
    notes: null,
    done: false,
    starred: false,
    assignedUserIds: [],
    recurrenceRule: null,
    parentItemId: null,
    createdByUserId: null,
    updatedByUserId: null,
    sortOrder: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  };
  const filters: Filters = { starredOnly: false, hideFuture: true, hideUndated: false, assigneeFilters: [] };

  function item(id: string, dueDate: string | null): TodoItem {
    return { ...baseItem, id, title: id, dueDate };
  }

  it('returns the local calendar date without UTC conversion', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 23, 30));

    expect(localIsoDate()).toBe('2026-06-15');
  });

  it('keeps undated, overdue, and due-today items while hiding future items', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12));

    const result = applyFilters(
      [
        item('undated', null),
        item('overdue', '2026-06-14'),
        item('today', '2026-06-15'),
        item('tomorrow', '2026-06-16')
      ],
      filters
    );

    expect(result.map((entry) => entry.id)).toEqual(['undated', 'overdue', 'today']);
  });

  it('treats a date-only value equal to local today as today and not overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12));

    expect(formatDueDate('2026-06-15')).toBe('Today');
    expect(isDueDateToday('2026-06-15')).toBe(true);
    expect(isDueDateOverdue('2026-06-15')).toBe(false);
  });

  it('formats adjacent due dates by calendar day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12));

    expect(formatDueDate('2026-06-14')).toBe('Yesterday');
    expect(formatDueDate('2026-06-16')).toBe('Tomorrow');
  });

  it('sorts due dates by calendar order and keeps undated items last when ascending', () => {
    const result = applySort(
      [
        item('undated', null),
        item('future', '2026-06-16'),
        item('past', '2026-06-14'),
        item('today', '2026-06-15')
      ],
      'DUE_DATE',
      'ASC'
    );

    expect(result.map((entry) => entry.id)).toEqual(['past', 'today', 'future', 'undated']);
  });

  it('adds days to date-only values using local calendar arithmetic', () => {
    expect(addDaysToDateOnly('2026-06-15', 1)).toBe('2026-06-16');
  });
});

describe('groupByCategory', () => {
  const baseItem: Omit<TodoItem, 'id' | 'categoryId'> = {
    listId: 'l1',
    title: 'Test',
    starred: false,
    done: false,
    createdAt: '2024-01-01T00:00:00Z',
    sortOrder: 0,
    dueDate: null,
    notes: null,
    recurrenceRule: null,
    parentItemId: null,
    createdByUserId: null,
    updatedByUserId: null,
    updatedAt: '2024-01-01T00:00:00Z',
    assignedUserIds: [],
  };

  const categories: Category[] = [
    { id: 'cat-a', listId: 'l1', name: 'A', color: null, sortOrder: 2 },
    { id: 'cat-b', listId: 'l1', name: 'B', color: null, sortOrder: 0 },
  ];

  it('orders real category groups by sortOrder and keeps uncategorized at the bottom', () => {
    const items: TodoItem[] = [
      { ...baseItem, id: 'item-uncategorized', categoryId: null },
      { ...baseItem, id: 'item-a', categoryId: 'cat-a' },
      { ...baseItem, id: 'item-b', categoryId: 'cat-b' },
    ];

    expect(Array.from(groupByCategory(items, categories).keys())).toEqual(['cat-b', 'cat-a', null]);
  });

  it('returns only the uncategorized group when no visible real category groups contain items', () => {
    const items: TodoItem[] = [
      { ...baseItem, id: 'item-uncategorized', categoryId: null },
    ];

    expect(Array.from(groupByCategory(items, categories).keys())).toEqual([null]);
  });
});
