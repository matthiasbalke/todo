import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ItemDetails from './ItemDetails.svelte';
import type { TodoItem } from '$lib/mock-data';

const baseItem: TodoItem = {
  id: 'item-1',
  listId: 'list-1',
  title: 'Test item',
  notes: 'Some notes',
  done: false,
  starred: false,
  dueDate: null,
  categoryId: null,
  assignedUserIds: [],
  recurrenceRule: null,
  parentItemId: null,
  createdByUserId: 'u1',
  sortOrder: 1,
  createdAt: '2026-01-02T10:01:00',
  updatedAt: '2026-02-05T15:31:00',
};

const users = [{ id: 'u1', name: 'Alice', email: 'alice@example.com' }];

describe('ItemDetails audit footer', () => {
  it('shows updated and created lines below the notes', () => {
    const { container } = render(ItemDetails, {
      props: { item: baseItem, categories: [], users },
    });
    const text = container.textContent ?? '';
    expect(text).toMatch(/\w{3} \d{1,2}\. \w{3} \d{2} at \d{2}:\d{2} updated/);
    expect(text).toContain('created by Alice');
  });

  it('falls back to Unknown for missing creator', () => {
    const { container } = render(ItemDetails, {
      props: { item: { ...baseItem, createdByUserId: null }, categories: [], users },
    });
    expect(container.textContent ?? '').toContain('created by Unknown');
  });
});
