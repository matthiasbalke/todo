import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ItemCard from './ItemCard.svelte';
import type { TodoItem } from '$lib/mock-data';

const baseItem: TodoItem = {
  id: 'item-1',
  listId: 'list-1',
  title: 'Test item',
  notes: null,
  done: false,
  starred: false,
  dueDate: null,
  categoryId: null,
  assignedUserIds: [],
  recurrenceRule: null,
  parentItemId: null,
  createdByUserId: null,
  sortOrder: 1,
  createdAt: '2024-01-01',
};

describe('ItemCard star button alignment', () => {
  it('star button should have self-center class for vertical centering in flex-start container', () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });

    const starButton = container.querySelector('button[aria-label="Star"]') ??
                       container.querySelector('button[aria-label="Unstar"]');
    expect(starButton).not.toBeNull();
    expect(starButton!.className).toContain('self-center');
  });
});
