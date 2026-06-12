import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('$lib/stores/items.svelte', () => ({
  toggleDone:    vi.fn().mockResolvedValue(undefined),
  toggleStarred: vi.fn().mockResolvedValue(undefined),
  deleteItem:    vi.fn().mockResolvedValue(undefined),
}));
vi.mock('$lib/api/errors', () => ({
  friendlyError: vi.fn((e: unknown) => String(e)),
}));

import { render, fireEvent } from '@testing-library/svelte';
import * as itemsStore from '$lib/stores/items.svelte';
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

describe('ItemCard delete background visibility', () => {
  it('the red delete background should be invisible when not swiping', () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const deleteAction = container.querySelector('button[aria-label="Delete item"]');
    expect(deleteAction).not.toBeNull();
    expect(deleteAction).toHaveClass('bg-red-600');
    expect(deleteAction!.parentElement!.className).toContain('invisible');
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

describe('ItemCard link navigation on mobile tap', () => {
  it('does not apply snapping transition after a plain tap (so the link click is not suppressed)', async () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });

    const card = container.firstElementChild as HTMLElement;
    const slidingCard = container.querySelector<HTMLElement>('div.bg-white.rounded-lg');
    expect(slidingCard).not.toBeNull();

    await fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 200 }],
    });
    await fireEvent.touchEnd(card, {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    });

    expect(slidingCard!.style.transition).toBe('none');
  });
});

describe('ItemCard checkbox interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires toggleDone when touchend fires on the checkbox (mobile tap)', async () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const checkbox = container.querySelector('button[aria-label="Mark done"]')!;
    await fireEvent.touchEnd(checkbox);
    expect(itemsStore.toggleDone).toHaveBeenCalledOnce();
    expect(itemsStore.toggleDone).toHaveBeenCalledWith('list-1', 'item-1');
  });

  it('fires toggleDone when click fires on the checkbox (desktop mouse)', async () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const checkbox = container.querySelector('button[aria-label="Mark done"]')!;
    await fireEvent.click(checkbox);
    expect(itemsStore.toggleDone).toHaveBeenCalledOnce();
    expect(itemsStore.toggleDone).toHaveBeenCalledWith('list-1', 'item-1');
  });
});

describe('ItemCard specialized actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires toggleStarred once for mouse and touch activation', async () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });
    const star = container.querySelector('button[aria-label="Star"]')!;

    await fireEvent.click(star);
    expect(itemsStore.toggleStarred).toHaveBeenCalledOnce();

    vi.mocked(itemsStore.toggleStarred).mockClear();
    await fireEvent.touchEnd(star);
    expect(itemsStore.toggleStarred).toHaveBeenCalledOnce();
  });

  it('activates the revealed delete action through the existing workflow', async () => {
    const { container } = render(ItemCard, {
      props: { item: baseItem, categories: [], users: [] },
    });

    await fireEvent.click(container.querySelector('button[aria-label="Delete item"]')!);
    expect(itemsStore.deleteItem).toHaveBeenCalledOnce();
    expect(itemsStore.deleteItem).toHaveBeenCalledWith('list-1', 'item-1');
  });
});
