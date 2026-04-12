import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
	isHideDone: vi.fn(() => false),
	setHideDone: vi.fn(),
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

describe('ListPage accessibility', () => {
	afterEach(() => {
		cleanup();
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
