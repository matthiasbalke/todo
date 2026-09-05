import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Category, TodoItem } from '$lib/mock-data';

const storeMocks = vi.hoisted(() => ({
	moveItemsToCategoryOptimistic: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/stores/items.svelte', () => ({
	moveItemsToCategoryOptimistic: storeMocks.moveItemsToCategoryOptimistic,
}));

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((error: unknown) => String(error))
}));

vi.mock('svelte-dnd-action', () => ({
	SHADOW_ITEM_MARKER_PROPERTY_NAME: '__isDndShadowItem',
	dragHandleZone: vi.fn(() => ({ destroy: vi.fn() })),
	dragHandle: vi.fn(() => ({ destroy: vi.fn() })),
}));

import CategoryGroup from './CategoryGroup.svelte';

const category: Category = {
	id: 'category-1',
	listId: 'list-1',
	name: 'Household',
	color: '#2563eb',
	sortOrder: 0
};

function makeItem(id: string, categoryId: string | null): TodoItem {
	return {
		id,
		listId: 'list-1',
		categoryId,
		title: `Item ${id}`,
		notes: null,
		done: false,
		starred: false,
		dueDate: null,
		assignedUserIds: [],
		recurrenceRule: null,
		parentItemId: null,
		createdByUserId: 'user-1',
		sortOrder: 0,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-02T00:00:00Z',
	};
}

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('CategoryGroup header alignment', () => {
	it('left aligns a named expanded category and collapses it on activation', async () => {
		const oncollapsedchange = vi.fn();
		render(CategoryGroup, {
			props: {
				categoryId: category.id,
				category,
				items: [],
				allCategories: [category],
				users: [],
				listId: 'list-1',
				collapsed: false,
				oncollapsedchange
			}
		});

		const header = screen.getByRole('button', { name: 'Household' });
		expect(header).toHaveClass('justify-between');
		expect(header).toHaveAttribute('aria-expanded', 'true');
		expect(header).toHaveTextContent('▼');

		await fireEvent.click(header);

		expect(header).toHaveAttribute('aria-expanded', 'false');
		expect(header).toHaveTextContent('▶');
		expect(oncollapsedchange).toHaveBeenCalledWith(true);
	});

	it('left aligns an uncategorized collapsed header and expands it on activation', async () => {
		const oncollapsedchange = vi.fn();
		render(CategoryGroup, {
			props: {
				categoryId: null,
				category: null,
				items: [],
				allCategories: [],
				users: [],
				listId: 'list-1',
				collapsed: true,
				oncollapsedchange
			}
		});

		const header = screen.getByRole('button', { name: 'Uncategorized' });
		expect(header).toHaveClass('justify-between');
		expect(header).toHaveAttribute('aria-expanded', 'false');
		expect(header).toHaveTextContent('▶');

		await fireEvent.click(header);

		expect(header).toHaveAttribute('aria-expanded', 'true');
		expect(header).toHaveTextContent('▼');
		expect(oncollapsedchange).toHaveBeenCalledWith(false);
	});
});

describe('CategoryGroup drag-and-drop', () => {
	it('moves finalized items into this category in dropped order', async () => {
		const itemInCategory = makeItem('item-1', category.id);
		const movedItem = makeItem('item-2', 'category-2');
		const { container } = render(CategoryGroup, {
			props: {
				categoryId: category.id,
				category,
				items: [itemInCategory],
				allCategories: [category],
				users: [],
				listId: 'list-1',
				isDraggable: true,
			}
		});

		const zone = container.querySelector('[data-testid="category-drop-zone-category-1"]');
		await fireEvent(
			zone as Element,
			new CustomEvent('finalize', {
				detail: { items: [itemInCategory, movedItem] },
				bubbles: true,
			}),
		);

		expect(storeMocks.moveItemsToCategoryOptimistic).toHaveBeenCalledWith('list-1', 'category-1', ['item-1', 'item-2']);
	});

	it('keeps same-category reorders on the current category', async () => {
		const first = makeItem('item-1', category.id);
		const second = makeItem('item-2', category.id);
		const { container } = render(CategoryGroup, {
			props: {
				categoryId: category.id,
				category,
				items: [first, second],
				allCategories: [category],
				users: [],
				listId: 'list-1',
				isDraggable: true,
			}
		});

		const zone = container.querySelector('[data-testid="category-drop-zone-category-1"]');
		await fireEvent(
			zone as Element,
			new CustomEvent('finalize', {
				detail: { items: [second, first] },
				bubbles: true,
			}),
		);

		expect(storeMocks.moveItemsToCategoryOptimistic).toHaveBeenCalledWith('list-1', 'category-1', ['item-2', 'item-1']);
	});

	it('moves finalized items into the uncategorized group', async () => {
		const movedItem = makeItem('item-1', category.id);
		const { container } = render(CategoryGroup, {
			props: {
				categoryId: null,
				category: null,
				items: [],
				allCategories: [category],
				users: [],
				listId: 'list-1',
				isDraggable: true,
			}
		});

		const zone = container.querySelector('[data-testid="category-drop-zone-uncategorized"]');
		await fireEvent(
			zone as Element,
			new CustomEvent('finalize', {
				detail: { items: [movedItem] },
				bubbles: true,
			}),
		);

		expect(storeMocks.moveItemsToCategoryOptimistic).toHaveBeenCalledWith('list-1', null, ['item-1']);
	});
});
