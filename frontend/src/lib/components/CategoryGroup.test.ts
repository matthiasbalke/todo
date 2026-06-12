import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Category } from '$lib/mock-data';

vi.mock('$lib/stores/items.svelte', () => ({
	reorderItemsOptimistic: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((error: unknown) => String(error))
}));

import CategoryGroup from './CategoryGroup.svelte';

const category: Category = {
	id: 'category-1',
	listId: 'list-1',
	name: 'Household',
	color: '#2563eb',
	sortOrder: 0
};

afterEach(cleanup);

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
