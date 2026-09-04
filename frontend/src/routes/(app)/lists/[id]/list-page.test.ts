import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listStoreState = vi.hoisted(() => ({
	hideDone: false,
	role: 'OWNER' as 'OWNER' | 'EDITOR' | 'VIEWER',
	categories: [] as { id: string; listId: string; name: string; color: string | null; sortOrder: number }[],
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

const listItemDefaultsMocks = vi.hoisted(() => ({
	loadListItemDefaults: vi.fn<() => { lastCategoryId: string | null } | null>(() => null),
	saveListItemDefaults: vi.fn(),
	deleteListItemDefaults: vi.fn(),
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/items.svelte', () => ({
	getItems: vi.fn(() => listStoreState.items),
	loadItemsForList: vi.fn(),
	createItem: vi.fn(),
	deleteFinishedItems: vi.fn(),
	moveItemsToCategoryOptimistic: vi.fn(),
}));

vi.mock('$lib/stores/lists.svelte', () => ({
	getList: vi.fn(() => ({
		id: 'list-1',
		name: 'Groceries',
		emoji: '🛒',
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2024-01-01T00:00:00Z',
		groupId: null,
		sortOrderInGroup: 0,
		role: listStoreState.role,
	})),
	updateList: vi.fn(),
	deleteList: vi.fn(),
	duplicateList: vi.fn().mockResolvedValue({
		id: 'list-2',
		name: 'Groceries (1)',
		emoji: '🛒',
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2024-01-02T00:00:00Z',
		groupId: null,
		sortOrderInGroup: 0,
		role: 'OWNER',
	}),
	getCategoriesForList: vi.fn(() => listStoreState.categories),
	loadCategoriesForList: vi.fn(() => Promise.resolve()),
	isHideDone: vi.fn(() => listStoreState.hideDone),
	setHideDone: vi.fn((_listId: string, value: boolean) => {
		listStoreState.hideDone = value;
	}),
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => null),
	setSession: vi.fn(),
	clearSession: vi.fn(),
	restoreSession: vi.fn(),
	isAuthenticated: vi.fn(() => false),
	getAccessToken: vi.fn(() => null),
}));

vi.mock('$lib/api/lists', () => ({
	getMembers: vi.fn().mockResolvedValue([]),
}));

vi.mock('$lib/listPrefs', () => ({
	loadListPrefs: vi.fn(() => null),
	saveListPrefs: vi.fn(),
	deleteListPrefs: vi.fn(),
}));

vi.mock('$lib/listCategoryState', () => ({
	loadListCategoryState: vi.fn(() => null),
	saveListCategoryState: vi.fn(),
	deleteListCategoryState: vi.fn(),
}));

vi.mock('$lib/listItemDefaults', () => listItemDefaultsMocks);

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((e: unknown) => String(e)),
}));

import ListPage from './+page.svelte';

const mockData = { id: 'list-1', users: [], buildNumber: '0' };

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

describe('ListPage title emoji extraction', () => {
	afterEach(() => {
		cleanup();
		listStoreState.hideDone = false;
		listStoreState.role = 'OWNER';
		listStoreState.categories = [];
		listStoreState.items = [];
		listItemDefaultsMocks.loadListItemDefaults.mockReturnValue(null);
		vi.clearAllMocks();
	});

	it('saves correct emoji and name when title has emoji-with-variation-selector not followed by a space (🏞️SSE Test)', async () => {
		const { updateList } = await import('$lib/stores/lists.svelte');
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: /Groceries/i }));
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: '🏞️SSE Test' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(updateList).toHaveBeenCalledWith('list-1', { name: 'SSE Test', emoji: '🏞️' });
	});
});

describe('ListPage accessibility', () => {
	afterEach(() => {
		cleanup();
		listStoreState.hideDone = false;
		listStoreState.role = 'OWNER';
		listStoreState.categories = [];
		listStoreState.items = [];
		listItemDefaultsMocks.loadListItemDefaults.mockReturnValue(null);
		vi.clearAllMocks();
	});

	it('list title should not use h1 with role="button" (non-interactive element with interactive role)', () => {
		render(ListPage, { props: { data: mockData } });
		// <h1 role="button"> violates ARIA: non-interactive elements must not take interactive roles
		expect(document.querySelector('h1[role="button"]')).not.toBeInTheDocument();
	});

	it('title edit input should not have autofocus attribute', async () => {
		render(ListPage, { props: { data: mockData } });
		// Click the title to enter edit mode — find by the list name text
		await fireEvent.click(screen.getByRole('button', { name: /Groceries/i }));
		const input = screen.getByRole('textbox');
		// autofocus is an a11y anti-pattern; programmatic .focus() should be used instead
		expect(input).not.toHaveAttribute('autofocus');
	});
});

describe('ListPage menu presentation', () => {
	afterEach(() => {
		cleanup();
		listStoreState.hideDone = false;
		listStoreState.role = 'OWNER';
		listStoreState.categories = [];
		listStoreState.items = [];
		listItemDefaultsMocks.loadListItemDefaults.mockReturnValue(null);
		vi.clearAllMocks();
	});

	it('hides shared mutation controls for viewers while preserving presentation and navigation controls', async () => {
		listStoreState.role = 'VIEWER';
		listStoreState.items = [makeItem('item-1', 'Checked item', true)];
		render(ListPage, { props: { data: mockData } });

		expect(screen.getByRole('heading', { name: /Groceries/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '+ Add item' })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.getByRole('button', { name: 'Grocery mode' })).toBeInTheDocument();
		const filterButton = screen.getByRole('button', { name: /Filter/ });
		expect(filterButton).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Sort/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hide checked' })).not.toBeInTheDocument();
		await fireEvent.click(filterButton);
		expect(screen.getByRole('button', { name: 'Hide checked' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Members' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Configure categories' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Duplicate list' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete checked items' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete list' })).not.toBeInTheDocument();
	});

	it('does not expose item drag handles or category drop zones to viewers', () => {
		listStoreState.role = 'VIEWER';
		listStoreState.categories = [
			{ id: 'category-1', listId: 'list-1', name: 'Groceries', color: null, sortOrder: 1 },
		];
		listStoreState.items = [
			{
				id: 'item-1',
				listId: 'list-1',
				categoryId: 'category-1',
				title: 'Milk',
				notes: null,
				done: false,
				starred: false,
				dueDate: null,
				assignedUserIds: [],
					recurrenceRule: null,
					parentItemId: null,
					createdByUserId: 'user-1',
					updatedByUserId: 'user-1',
					sortOrder: 0,
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z',
				},
		];

		const { container } = render(ListPage, { props: { data: mockData } });

		expect(screen.getByText('Milk')).toBeInTheDocument();
		expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
		expect(container.querySelector('[data-testid^="category-drop-zone-"]')).not.toBeInTheDocument();
	});

	it('keeps item and category controls for editors but hides list management', async () => {
		listStoreState.role = 'EDITOR';
		render(ListPage, { props: { data: mockData } });

		expect(screen.getByRole('button', { name: '+ Add item' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Groceries/i })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.getByRole('button', { name: 'Configure categories' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Duplicate list' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete list' })).not.toBeInTheDocument();
	});

	it('shows duplicate directly above delete for owners', async () => {
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		const buttons = screen.getAllByRole('button').map((button) => button.textContent?.trim());
		const duplicateIndex = buttons.indexOf('Duplicate list');
		const deleteIndex = buttons.indexOf('Delete list');

		expect(duplicateIndex).toBeGreaterThan(-1);
		expect(deleteIndex).toBeGreaterThan(-1);
		expect(duplicateIndex).toBe(deleteIndex - 1);
	});

	it('displays the delete checked action disabled when the list has no checked items', async () => {
		listStoreState.items = [makeItem('item-1', 'Unchecked item')];
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));

		expect(screen.getByRole('button', { name: 'Delete checked items' })).toBeDisabled();
	});

	it('deletes checked items after modal confirmation using the full unfiltered list count', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		vi.mocked(deleteFinishedItems).mockResolvedValueOnce(undefined);
		listStoreState.items = [
			makeItem('checked-hidden-by-starred', 'Hidden checked item', true, false),
			makeItem('checked-visible', 'Visible checked item', true, true),
			makeItem('unchecked-visible', 'Visible unchecked item', false, true),
		];
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Starred only' }));
		expect(screen.queryByText('Hidden checked item')).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));

		expect(screen.getByRole('dialog', { name: 'Delete all checked items?' })).toBeInTheDocument();
		expect(screen.getByText(/permanently delete 2 checked items/)).toHaveClass('font-semibold', 'text-red-600');
		expect(screen.getByText('Checked items hidden by filters will also be deleted.')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked' }));

		await waitFor(() => expect(deleteFinishedItems).toHaveBeenCalledWith('list-1'));
		expect(screen.queryByRole('dialog', { name: 'Delete all checked items?' })).not.toBeInTheDocument();
	});

	it('does not delete checked items when the confirmation modal is canceled', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		listStoreState.items = [makeItem('checked-1', 'Checked item', true)];
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(deleteFinishedItems).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog', { name: 'Delete all checked items?' })).not.toBeInTheDocument();
	});

	it('keeps the delete checked modal open and reports errors when cleanup fails', async () => {
		const { deleteFinishedItems } = await import('$lib/stores/items.svelte');
		vi.mocked(deleteFinishedItems).mockRejectedValueOnce(new Error('boom'));
		listStoreState.items = [makeItem('checked-1', 'Checked item', true)];
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked items' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Delete checked' }));

		await waitFor(() => expect(screen.getByText('Error: boom')).toBeInTheDocument());
		expect(screen.getByRole('dialog', { name: 'Delete all checked items?' })).toBeInTheDocument();
	});

	it('duplicates the list and navigates to the copy', async () => {
		const { goto } = await import('$app/navigation');
		const { duplicateList } = await import('$lib/stores/lists.svelte');
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Duplicate list' }));

		expect(duplicateList).toHaveBeenCalledWith('list-1');
		await waitFor(() => expect(goto).toHaveBeenCalledWith('/lists/list-2'));
	});

	it('reports duplicate failures without navigating away', async () => {
		const alert = vi.fn();
		vi.stubGlobal('alert', alert);
		const { goto } = await import('$app/navigation');
		const { duplicateList } = await import('$lib/stores/lists.svelte');
		vi.mocked(duplicateList).mockRejectedValueOnce(new Error('boom'));
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Duplicate list' }));

		await waitFor(() => expect(alert).toHaveBeenCalledWith('Error: boom'));
		expect(goto).not.toHaveBeenCalledWith('/lists/list-2');
		vi.unstubAllGlobals();
	});

	it('uses blue text and inherited check marks for selected menu choices', async () => {
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		expect(screen.queryByRole('link', { name: 'Grocery mode' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Grocery mode' })).toHaveClass(
			'justify-start',
			'font-normal',
			'w-full',
			'px-4',
			'py-2',
			'text-sm',
			'text-gray-700',
			'hover:text-gray-900'
		);
		expect(screen.getByRole('button', { name: 'Configure categories' })).toHaveClass(
			'justify-start',
			'font-normal'
		);
		expect(screen.getByRole('button', { name: 'Members' })).toHaveClass(
			'justify-start',
			'font-normal'
		);

		const filterButton = screen.getByRole('button', { name: /Filter/ });
		expect(filterButton).toHaveClass('justify-between', 'font-normal');
		await fireEvent.click(filterButton);

		const selected = screen.getAllByRole('button', { name: 'All items ✓' })[0];
		const unselected = screen.getByRole('button', { name: 'Starred only' });
		expect(selected).toHaveClass('justify-between', 'font-normal', 'text-menu-selected');
		expect(selected.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(selected.querySelector('span:last-child')).not.toHaveAttribute('class');
		expect(selected).not.toHaveClass('font-medium');
		expect(unselected).toHaveClass('font-normal', 'text-gray-700');
		expect(unselected).not.toHaveClass('text-menu-selected', 'font-medium');

		await fireEvent.click(filterButton);
		const sortButton = screen.getByRole('button', { name: /Sort/ });
		await fireEvent.click(sortButton);

		const selectedSort = screen.getByRole('button', { name: 'Manual ✓' });
		expect(selectedSort).toHaveClass('text-menu-selected');
		expect(selectedSort.querySelector('span:last-child')).toHaveTextContent('✓');
		expect(screen.getByRole('button', { name: 'Created' })).toHaveClass('text-gray-700');

		await fireEvent.click(sortButton);
		await fireEvent.click(filterButton);
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
		render(ListPage, { props: { data: mockData } });

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

	it('shows active filter chips and resets only the selected filter', async () => {
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Starred only' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Hide checked' }));

		expect(screen.getByRole('button', { name: 'Clear Starred only filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear Hide checked filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Filter 2 active' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear Starred only filter' }));

		expect(screen.queryByRole('button', { name: 'Clear Starred only filter' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear Hide checked filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Filter 1 active' })).toBeInTheDocument();
	});

	it('navigates to grocery mode and closes the menu', async () => {
		const { goto } = await import('$app/navigation');
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Grocery mode' }));

		expect(goto).toHaveBeenCalledWith('/lists/list-1/grocery');
		expect(screen.queryByRole('button', { name: 'Grocery mode' })).not.toBeInTheDocument();
	});

	it('clears a remembered category default when that category is no longer in the list', async () => {
		const { createItem } = await import('$lib/stores/items.svelte');
		const { deleteListItemDefaults } = await import('$lib/listItemDefaults');
		listStoreState.categories = [
			{ id: 'category-1', listId: 'list-1', name: 'Groceries', color: null, sortOrder: 1 },
		];
		listItemDefaultsMocks.loadListItemDefaults.mockReturnValue({ lastCategoryId: 'deleted-category' });
		render(ListPage, { props: { data: mockData } });

		await waitFor(() => expect(deleteListItemDefaults).toHaveBeenCalledWith('list-1'));
		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));

		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Uncategorized');
		await fireEvent.input(screen.getByPlaceholderText('Item title'), {
			target: { value: 'Fallback item' },
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(createItem).toHaveBeenCalledWith('list-1', expect.objectContaining({ categoryId: null }));
	});

	it('restores an add-item draft after focus loss minimizes the form', async () => {
		render(ListPage, { props: { data: mockData } });
		const externalElement = document.createElement('button');
		document.body.appendChild(externalElement);

		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
		await fireEvent.input(screen.getByPlaceholderText('Item title'), {
			target: { value: 'Preserved title' },
		});
		await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
			target: { value: 'Preserved notes' },
		});
		await fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
			relatedTarget: externalElement,
		});

		expect(screen.queryByPlaceholderText('Item title')).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));

		expect(screen.getByPlaceholderText('Item title')).toHaveValue('Preserved title');
		expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Preserved notes');
		externalElement.remove();
	});

	it('clears an add-item draft after explicit cancellation', async () => {
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
		await fireEvent.input(screen.getByPlaceholderText('Item title'), {
			target: { value: 'Discarded title' },
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));

		expect(screen.getByPlaceholderText('Item title')).toHaveValue('');
	});

	it('clears an add-item draft after successful submission', async () => {
		const { createItem } = await import('$lib/stores/items.svelte');
		render(ListPage, { props: { data: mockData } });
		const externalElement = document.createElement('button');
		document.body.appendChild(externalElement);

		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
		await fireEvent.input(screen.getByPlaceholderText('Item title'), {
			target: { value: 'Submitted title' },
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => expect(createItem).toHaveBeenCalledWith('list-1', expect.objectContaining({
			title: 'Submitted title',
		})));
		await fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
			relatedTarget: externalElement,
		});
		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));

		expect(screen.getByPlaceholderText('Item title')).toHaveValue('');
		externalElement.remove();
	});

	it('keeps an add-item draft available after failed submission', async () => {
		const alert = vi.fn();
		vi.stubGlobal('alert', alert);
		const { createItem } = await import('$lib/stores/items.svelte');
		vi.mocked(createItem).mockRejectedValueOnce(new Error('boom'));
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
		await fireEvent.input(screen.getByPlaceholderText('Item title'), {
			target: { value: 'Retry title' },
		});
		await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
			target: { value: 'Retry notes' },
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => expect(alert).toHaveBeenCalledWith('Error: boom'));
		expect(screen.getByPlaceholderText('Item title')).toHaveValue('Retry title');
		expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Retry notes');
		vi.unstubAllGlobals();
	});
});
