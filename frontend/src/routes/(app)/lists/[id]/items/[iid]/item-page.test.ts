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
import { updateItem } from '$lib/stores/items.svelte';

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

		expect(await screen.findByRole('heading', { name: 'Apples' })).toBeInTheDocument();
		expect(screen.getByText('Get Braeburn')).toBeInTheDocument();
		expect(screen.getByText('Produce')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
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
});
