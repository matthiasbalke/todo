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

describe('ItemCard avatar alignment', () => {
  it('avatar icons should not use self-center (parent items-center handles alignment)', () => {
    const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
    const item = { ...baseItem, assignedUserIds: ['u1'] };
    const { container } = render(ItemCard, {
      props: { item, categories: [], users: [user] },
    });

    const avatar = container.querySelector('div.rounded-full.bg-blue-100');
    expect(avatar).not.toBeNull();
    expect(avatar!.className).not.toContain('self-center');
  });
});

describe('ItemCard star button alignment', () => {
  it('star button should not use self-center (parent items-center handles alignment)', () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });

    const starButton = container.querySelector('button[aria-label="Star"]') ??
                       container.querySelector('button[aria-label="Unstar"]');
    expect(starButton).not.toBeNull();
    expect(starButton!.className).not.toContain('self-center');
  });
});

describe('ItemCard vertical alignment', () => {
  it('the card container should vertically center its children', () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const card = container.querySelector('div.bg-white');
    expect(card).not.toBeNull();
    expect(card!.className).toContain('items-center');
  });

  it('the done checkbox should not use a top-margin offset for alignment', () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const checkbox = container.querySelector('button[aria-label="Mark done"]') ??
                     container.querySelector('button[aria-label="Mark undone"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox!.className).not.toContain('mt-0.5');
  });
});
