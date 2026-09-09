import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TodoItem } from '$lib/mock-data';

const pageState = vi.hoisted(() => ({
	role: 'OWNER' as 'OWNER' | 'EDITOR' | 'VIEWER',
}));

const item: TodoItem = {
	id: 'item-1',
	listId: 'list-1',
	categoryId: 'category-1',
	title: 'Apples',
	notes: 'Get Braeburn',
	done: true,
	starred: true,
	dueDate: '2026-06-13',
	assignedUserIds: ['user-1'],
	recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 1 },
	parentItemId: null,
	createdByUserId: 'user-1',
	updatedByUserId: 'user-1',
	sortOrder: 0,
	createdAt: '2026-06-01T10:00:00Z',
	updatedAt: '2026-06-02T15:31:02Z',
};

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/items.svelte', () => ({
	getItems: vi.fn(() => [item]),
	loadItemsForList: vi.fn(),
	updateItem: vi.fn(),
	toggleDone: vi.fn(),
	toggleStarred: vi.fn(),
	deleteItem: vi.fn(),
}));
vi.mock('$lib/stores/lists.svelte', () => ({
	getList: vi.fn(() => ({
		id: 'list-1',
		name: 'Groceries',
		emoji: '🛒',
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2026-06-01',
		groupId: null,
		sortOrderInGroup: 0,
		role: pageState.role,
	})),
	getCategoriesForList: vi.fn(() => [
		{ id: 'category-1', listId: 'list-1', name: 'Produce', color: null, sortOrder: 0 },
	]),
	loadCategoriesForList: vi.fn(),
}));
vi.mock('$lib/api/lists', () => ({
	getMembers: vi.fn().mockResolvedValue([
		{
			userId: 'user-1',
			email: 'alice@example.com',
			displayName: 'Alice',
			role: 'VIEWER',
			createdAt: '2026-06-01',
		},
	]),
}));
vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((error: unknown) => String(error)),
}));

import ItemPage from './+page.svelte';
import { goto } from '$app/navigation';
import { toggleDone, toggleStarred, updateItem } from '$lib/stores/items.svelte';

afterEach(() => {
	cleanup();
	pageState.role = 'OWNER';
	vi.clearAllMocks();
});

describe('item detail page loader', () => {
	it('should not include mock users in page data', async () => {
		const { load } = await import('./+page');
		const result = load({
			params: { id: 'list-1', iid: 'item-1' },
			url: new URL('https://example.test/lists/list-1/items/item-1'),
		} as any);
		expect(result).not.toHaveProperty('users');
		expect(result).toMatchObject({ id: 'list-1', iid: 'item-1', returnTo: null });
	});

	it('accepts Today as a return destination and rejects arbitrary paths', async () => {
		const { load } = await import('./+page');
		const fromToday = load({
			params: { id: 'list-1', iid: 'item-1' },
			url: new URL('https://example.test/lists/list-1/items/item-1?returnTo=%2Ftoday'),
		} as any);
		const arbitrary = load({
			params: { id: 'list-1', iid: 'item-1' },
			url: new URL('https://example.test/lists/list-1/items/item-1?returnTo=https%3A%2F%2Fevil.test'),
		} as any);

		expect(fromToday).toMatchObject({ returnTo: '/today' });
		expect(arbitrary).toMatchObject({ returnTo: null });
	});
});

describe('item detail capabilities', () => {
	it('renders read-only item information for viewers', async () => {
		pageState.role = 'VIEWER';
		render(ItemPage, { props: { data: { id: 'list-1', iid: 'item-1', returnTo: null, buildNumber: '0' } } });

		const title = await screen.findByRole('textbox', { name: 'Title' });
		const starred = screen.getByLabelText('Starred');
		const category = screen.getByRole('combobox', { name: 'Category' });
		const dueDate = screen.getByRole('button', { name: 'Due Date' });
		const recurrence = screen.getByRole('combobox', { name: 'Recurrence' });
		const assignment = await screen.findByRole('button', { name: 'Alice' });
		const notes = screen.getByRole('textbox', { name: 'Notes' });
		const audit = screen.getByTestId('item-audit-metadata');

		expect(title).toHaveValue('Apples');
		expect(category).toHaveValue('Produce');
		expect(dueDate).toHaveTextContent('Jun 13, 2026');
		expect(recurrence).toHaveValue('Every week');
		expect(notes).toHaveValue('Get Braeburn');

		for (const control of [title, category, dueDate, recurrence, assignment, notes]) {
			expect(control).toBeDisabled();
		}

		expect(title.compareDocumentPosition(starred) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(title.compareDocumentPosition(category) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(category.compareDocumentPosition(dueDate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(dueDate.compareDocumentPosition(recurrence) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(recurrence.compareDocumentPosition(assignment) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(assignment.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(notes.compareDocumentPosition(audit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

		expect(screen.queryByRole('button', { name: 'Mark undone' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Mark done' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete item' })).not.toBeInTheDocument();
	});

	it.each(['OWNER', 'EDITOR'] as const)('keeps the editable form for %s', (role) => {
		pageState.role = role;
		render(ItemPage, { props: { data: { id: 'list-1', iid: 'item-1', returnTo: null, buildNumber: '0' } } });

		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument();
	});

	it('returns to Today after cancel when opened from Today', async () => {
		render(ItemPage, {
			props: { data: { id: 'list-1', iid: 'item-1', returnTo: '/today', buildNumber: '0' } },
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(goto).toHaveBeenCalledWith('/today');
	});

	it('returns to the source list after save when opened from a list', async () => {
		vi.mocked(updateItem).mockResolvedValue(item);
		render(ItemPage, {
			props: { data: { id: 'list-1', iid: 'item-1', returnTo: null, buildNumber: '0' } },
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(goto).toHaveBeenCalledWith('/lists/list-1');
	});

	it('persists changed completion state immediately without saving', async () => {
		vi.mocked(toggleDone).mockResolvedValue(undefined);
		render(ItemPage, {
			props: { data: { id: 'list-1', iid: 'item-1', returnTo: null, buildNumber: '0' } },
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Mark undone' }));

		expect(toggleDone).toHaveBeenCalledWith('list-1', 'item-1');
		expect(updateItem).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('persists changed star state immediately without saving', async () => {
		vi.mocked(toggleStarred).mockResolvedValue(undefined);
		render(ItemPage, {
			props: { data: { id: 'list-1', iid: 'item-1', returnTo: null, buildNumber: '0' } },
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Unstar' }));

		expect(toggleStarred).toHaveBeenCalledWith('list-1', 'item-1');
		expect(updateItem).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});
});
