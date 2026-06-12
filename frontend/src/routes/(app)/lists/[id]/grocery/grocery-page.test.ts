import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listStoreState = vi.hoisted(() => ({ hideDone: false }));

vi.mock('$lib/stores/items.svelte', () => ({
	getItems: vi.fn(() => []),
	loadItemsForList: vi.fn()
}));
vi.mock('$lib/stores/lists.svelte', () => ({
	getList: vi.fn(() => ({
		id: 'list-1',
		name: 'Groceries',
		emoji: '🛒',
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2026-06-10',
		groupId: null,
		sortOrderInGroup: 0
	})),
	updateList: vi.fn(),
	getCategoriesForList: vi.fn(() => []),
	loadCategoriesForList: vi.fn(),
	isHideDone: vi.fn(() => listStoreState.hideDone),
	setHideDone: vi.fn((_listId: string, value: boolean) => {
		listStoreState.hideDone = value;
	})
}));
vi.mock('$lib/listPrefs', () => ({
	loadListPrefs: vi.fn(() => null),
	saveListPrefs: vi.fn(),
	deleteListPrefs: vi.fn()
}));
vi.mock('$lib/listCategoryState', () => ({
	loadListCategoryState: vi.fn(() => null),
	saveListCategoryState: vi.fn(),
	deleteListCategoryState: vi.fn()
}));
vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((error: unknown) => String(error))
}));

import GroceryPage from './+page.svelte';

afterEach(() => {
	cleanup();
	listStoreState.hideDone = false;
	vi.clearAllMocks();
});

describe('Grocery page menu presentation', () => {
	it('uses blue text and inherited check marks for selected menu choices', async () => {
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.getByRole('link', { name: 'Standard mode' })).toHaveClass('font-normal');
		expect(screen.getByRole('button', { name: 'Edit list' })).toHaveClass(
			'justify-start',
			'font-normal'
		);
		expect(screen.getByRole('button', { name: 'Configure categories' })).toHaveClass(
			'justify-start',
			'font-normal'
		);

		const sortButton = screen.getByRole('button', { name: /Sort/ });
		expect(sortButton).toHaveClass('justify-between', 'font-normal');
		await fireEvent.click(sortButton);

		const selected = screen.getByRole('button', { name: 'Manual ✓' });
		const unselected = screen.getByRole('button', { name: 'Created' });
		expect(selected).toHaveClass('justify-between', 'font-normal', 'text-menu-selected');
		expect(selected.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(selected.querySelector('span:last-child')).not.toHaveAttribute('class');
		expect(selected).not.toHaveClass('font-medium');
		expect(unselected).toHaveClass('font-normal', 'text-gray-700');
		expect(unselected).not.toHaveClass('text-menu-selected', 'font-medium');
		expect(screen.getByRole('button', { name: '↑ Ascending' })).toHaveClass(
			'justify-start',
			'font-normal'
		);

		await fireEvent.click(sortButton);
		const filterButton = screen.getByRole('button', { name: /Filter/ });
		await fireEvent.click(filterButton);

		const selectedFilter = screen.getAllByRole('button', { name: 'All items ✓' })[0];
		expect(selectedFilter).toHaveClass('text-menu-selected');
		expect(selectedFilter.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(screen.getByRole('button', { name: 'Starred only' })).toHaveClass('text-gray-700');

		await fireEvent.click(filterButton);
		const inactiveHideChecked = screen.getByRole('button', { name: 'Hide checked' });
		expect(inactiveHideChecked).toHaveClass('text-gray-700');
		expect(inactiveHideChecked).not.toHaveClass('text-menu-selected');

		await fireEvent.click(inactiveHideChecked);
		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));

		const activeHideChecked = screen.getByRole('button', { name: 'Hide checked ✓' });
		expect(activeHideChecked).toHaveClass('text-menu-selected');
		expect(activeHideChecked.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(activeHideChecked.querySelector('span:last-child')).not.toHaveAttribute('class');
	});
});
