import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listStoreState = vi.hoisted(() => ({
	hideDone: false,
	role: 'OWNER' as 'OWNER' | 'EDITOR' | 'VIEWER',
	items: [] as {
		id: string;
		listId: string;
		categoryId: string | null;
		title: string;
		notes: string | null;
		done: boolean;
		starred: boolean;
		dueDate: string | null;
		assignedUserIds: string[];
			recurrenceRule: null;
			parentItemId: string | null;
			createdByUserId: string | null;
			updatedByUserId: string | null;
			sortOrder: number;
			createdAt: string;
			updatedAt: string;
		}[],
}));

vi.mock('$lib/stores/items.svelte', () => ({
	getItems: vi.fn(() => listStoreState.items),
	loadItemsForList: vi.fn(),
	deleteFinishedItems: vi.fn()
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
		sortOrderInGroup: 0,
		role: listStoreState.role
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

function makeItem(id: string, title: string, done = false, starred = false) {
	return {
		id,
		listId: 'list-1',
		categoryId: null,
		title,
		notes: null,
		done,
		starred,
		dueDate: null,
		assignedUserIds: [],
		recurrenceRule: null,
		parentItemId: null,
		createdByUserId: 'user-1',
		updatedByUserId: 'user-1',
		sortOrder: 0,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
	};
}

afterEach(() => {
	cleanup();
	listStoreState.hideDone = false;
	listStoreState.role = 'OWNER';
	listStoreState.items = [];
	vi.clearAllMocks();
});

describe('Grocery page capabilities', () => {
	it('keeps navigation and presentation controls but hides mutation controls for viewers', async () => {
		listStoreState.role = 'VIEWER';
		listStoreState.items = [makeItem('checked-1', 'Checked item', true)];
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.getByRole('link', { name: 'Standard mode' })).toBeInTheDocument();
		const filterButton = screen.getByRole('button', { name: /Filter/ });
		expect(filterButton).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Sort/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hide checked' })).not.toBeInTheDocument();
		await fireEvent.click(filterButton);
		expect(screen.getByRole('button', { name: 'Hide checked' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Edit list' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Configure categories' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete checked items' })).not.toBeInTheDocument();
	});

	it('allows editors to configure categories but not edit the list', async () => {
		listStoreState.role = 'EDITOR';
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.getByRole('button', { name: 'Configure categories' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Edit list' })).not.toBeInTheDocument();
	});
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

		const inactiveHideChecked = screen.getByRole('button', { name: 'Hide checked' });
		expect(inactiveHideChecked).toHaveClass('text-gray-700');
		expect(inactiveHideChecked).not.toHaveClass('text-menu-selected');

		await fireEvent.click(inactiveHideChecked);

		const activeHideChecked = screen.getByRole('button', { name: 'Hide checked ✓' });
		expect(activeHideChecked).toHaveClass('text-menu-selected');
		expect(activeHideChecked.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(activeHideChecked.querySelector('span:last-child')).not.toHaveAttribute('class');
	});

	it('shows summary state and opens sort controls from the summary', async () => {
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		expect(screen.getByText('0 items')).toBeInTheDocument();
		const summarySort = screen.getByRole('button', { name: 'Change sort order: Manual ↑' });
		expect(summarySort).toHaveTextContent('Sort: Manual ↑');
		expect(screen.queryByRole('button', { name: /Clear .* filter/ })).not.toBeInTheDocument();

		await fireEvent.click(summarySort);
		expect(screen.queryByRole('button', { name: 'Filter' })).not.toBeInTheDocument();
		expect(screen.getByText('Sort by')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Created' }));
		expect(screen.getByRole('button', { name: 'Change sort order: Created ↑' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: '↑ Ascending' }));
		expect(screen.getByRole('button', { name: 'Change sort order: Created ↓' })).toBeInTheDocument();
	});

	it('shows supported filter chips and resets one filter at a time', async () => {
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Starred only' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Hide checked' }));

		expect(screen.getByRole('button', { name: 'Clear Starred only filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear Hide checked filter' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Assigned to/ })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear Hide checked filter' }));

		expect(screen.getByRole('button', { name: 'Clear Starred only filter' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Clear Hide checked filter' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Filter 1 active' })).toBeInTheDocument();
	});

	it('displays the delete checked action disabled when the list has no checked items', async () => {
		listStoreState.items = [makeItem('item-1', 'Unchecked item')];
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));

		expect(screen.getByRole('button', { name: 'Delete checked items' })).toBeDisabled();
	});

	it('deletes checked items after modal confirmation using the full list count when Hide checked is active', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		vi.mocked(deleteFinishedItems).mockResolvedValueOnce(undefined);
		listStoreState.items = [
			makeItem('checked-hidden', 'Hidden checked item', true),
			makeItem('unchecked-visible', 'Visible unchecked item', false),
		];
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Hide checked' }));
		expect(screen.queryByRole('button', { name: /Hidden checked item/ })).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));

		expect(screen.getByRole('dialog', { name: 'Delete all checked items?' })).toBeInTheDocument();
		expect(screen.getByText(/permanently delete 1 checked item/)).toHaveClass('font-semibold', 'text-red-600');

		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked' }));

		expect(deleteFinishedItems).toHaveBeenCalledWith('list-1');
	});

	it('does not delete checked items when the modal is canceled', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		listStoreState.items = [makeItem('checked-1', 'Checked item', true)];
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(deleteFinishedItems).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog', { name: 'Delete all checked items?' })).not.toBeInTheDocument();
	});

	it('keeps the modal open and reports errors when cleanup fails', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		vi.mocked(deleteFinishedItems).mockRejectedValueOnce(new Error('boom'));
		listStoreState.items = [makeItem('checked-1', 'Checked item', true)];
		render(GroceryPage, { props: { data: { id: 'list-1', buildNumber: '0' } } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked' }));

		expect(await screen.findByText('Error: boom')).toBeInTheDocument();
		expect(screen.getByRole('dialog', { name: 'Delete all checked items?' })).toBeInTheDocument();
	});
});
