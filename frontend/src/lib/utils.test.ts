import { describe, it, expect } from 'vitest';
import { recurrenceRuleToHuman, formatDueDate, isDueDateOverdue, isDueDateToday, applyFilters, applySort, groupByCategory } from './utils';
import type { Category, TodoItem } from './mock-data';
import type { Filters } from './utils';

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
  };
  const noAssignees: TodoItem = { ...base, id: 'a', assignedUserIds: [] };
  const assignedToMe: TodoItem = { ...base, id: 'b', assignedUserIds: ['user1'] };
  const assignedToOther: TodoItem = { ...base, id: 'c', assignedUserIds: ['user2'] };
  const assignedToMeAndOther: TodoItem = { ...base, id: 'd', assignedUserIds: ['user1', 'user2'] };

  const items = [noAssignees, assignedToMe, assignedToOther, assignedToMeAndOther];
  const baseFilters: Filters = { starredOnly: false, hideFuture: false, hideUndated: false, assigneeFilter: 'all' };

  it("'all' returns all items regardless of assignment", () => {
    expect(applyFilters(items, { ...baseFilters, assigneeFilter: 'all' }, 'user1')).toHaveLength(4);
  });

  it("'none' returns only unassigned items", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilter: 'none' }, 'user1');
    expect(result).toEqual([noAssignees]);
  });

  it("'me' returns items that include currentUserId", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilter: 'me' }, 'user1');
    expect(result.map(i => i.id)).toEqual(['b', 'd']);
  });

  it("'me' with no currentUserId returns no items", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilter: 'me' });
    expect(result).toHaveLength(0);
  });

  it("'others' returns items assigned but not to current user", () => {
    const result = applyFilters(items, { ...baseFilters, assigneeFilter: 'others' }, 'user1');
    expect(result).toEqual([assignedToOther]);
  });

  it("'others' excludes items where current user is one of multiple assignees", () => {
    const result = applyFilters([assignedToMeAndOther], { ...baseFilters, assigneeFilter: 'others' }, 'user1');
    expect(result).toHaveLength(0);
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
