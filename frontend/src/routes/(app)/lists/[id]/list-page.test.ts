import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listStoreState = vi.hoisted(() => ({ hideDone: false }));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/items.svelte', () => ({
	getItems: vi.fn(() => []),
	loadItemsForList: vi.fn(),
	createItem: vi.fn(),
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
	})),
	updateList: vi.fn(),
	deleteList: vi.fn(),
	getCategoriesForList: vi.fn(() => []),
	loadCategoriesForList: vi.fn(),
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

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((e: unknown) => String(e)),
}));

import ListPage from './+page.svelte';

const mockData = { id: 'list-1', users: [], buildNumber: '0' };

describe('ListPage title emoji extraction', () => {
	afterEach(() => {
		cleanup();
		listStoreState.hideDone = false;
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
		vi.clearAllMocks();
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

	it('navigates to grocery mode and closes the menu', async () => {
		const { goto } = await import('$app/navigation');
		render(ListPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('button', { name: 'List options' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Grocery mode' }));

		expect(goto).toHaveBeenCalledWith('/lists/list-1/grocery');
		expect(screen.queryByRole('button', { name: 'Grocery mode' })).not.toBeInTheDocument();
	});
});
