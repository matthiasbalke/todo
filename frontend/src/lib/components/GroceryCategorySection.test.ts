import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Category, TodoItem } from '$lib/mock-data';

vi.mock('$lib/stores/items.svelte', () => ({
	toggleDone: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((error: unknown) => String(error))
}));

import GroceryCategorySection from './GroceryCategorySection.svelte';

const category: Category = {
	id: 'produce',
	listId: 'list-1',
	name: 'Produce',
	color: null,
	sortOrder: 0
};

const baseItem: TodoItem = {
	id: 'item-1',
	listId: 'list-1',
	categoryId: category.id,
	title: 'Apples',
	notes: null,
	done: false,
	starred: false,
	dueDate: null,
	assignedUserIds: [],
	recurrenceRule: null,
	parentItemId: null,
	createdByUserId: null,
	sortOrder: 0,
	createdAt: '2026-06-10'
};

afterEach(cleanup);

describe('GroceryCategorySection alignment', () => {
	it('spreads the category label and item count across the header', () => {
		render(GroceryCategorySection, {
			props: { category, items: [baseItem], collapsed: false, ontoggle: vi.fn() }
		});

		expect(screen.getByRole('button', { name: /Produce/ })).toHaveClass('justify-between');
	});

	it('left aligns unchecked and checked grocery rows', () => {
		render(GroceryCategorySection, {
			props: {
				category,
				items: [baseItem, { ...baseItem, id: 'item-2', title: 'Bananas', done: true }],
				collapsed: false,
				ontoggle: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: 'Apples' })).toHaveClass('justify-start');
		expect(screen.getByRole('button', { name: 'Bananas' })).toHaveClass('justify-start');
	});
});
