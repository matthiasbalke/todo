import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { List, ListGroup } from '$lib/mock-data';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const storeMocks = vi.hoisted(() => ({
	getLists: vi.fn<() => List[]>(() => []),
	getListGroups: vi.fn<() => ListGroup[]>(() => []),
	createList: vi.fn(),
	createListGroup: vi.fn(),
	reorderListGroupsOptimistic: vi.fn().mockResolvedValue(undefined),
	isLoading: vi.fn(() => false),
}));

vi.mock('$lib/stores/lists.svelte', () => ({
	getLists: storeMocks.getLists,
	getListGroups: storeMocks.getListGroups,
	createList: storeMocks.createList,
	createListGroup: storeMocks.createListGroup,
	reorderListGroupsOptimistic: storeMocks.reorderListGroupsOptimistic,
	isLoading: storeMocks.isLoading,
}));

vi.mock('$lib/stores/drag.svelte', () => ({
	isDraggingAny: vi.fn(() => false),
}));

vi.mock('$lib/stores/preferences.svelte', () => ({
	getProfile: vi.fn(() => ({ todayViewEnabled: true })),
}));

vi.mock('$lib/stores/today.svelte', () => ({
	getTodayUnfinishedCount: vi.fn(() => 0),
	loadTodayCount: vi.fn(),
}));

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((e: unknown, msg: string) => msg),
}));

vi.mock('svelte-dnd-action', () => ({
	SHADOW_ITEM_MARKER_PROPERTY_NAME: '__isDndShadowItem',
	dragHandleZone: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
	dragHandle: vi.fn(() => ({ destroy: vi.fn() })),
}));

import ListsPage from './+page.svelte';
import { loadTodayCount } from '$lib/stores/today.svelte';

const groups: ListGroup[] = [
	{ id: 'group-home', userId: 'user-1', name: 'Home', sortOrder: 0, createdAt: '2026-01-01T00:00:00Z' },
	{ id: 'group-work', userId: 'user-1', name: 'Work', sortOrder: 1, createdAt: '2026-01-01T00:00:00Z' },
];

const lists: List[] = [
	{
		id: 'list-home',
		name: 'Groceries',
		emoji: null,
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2026-01-01T00:00:00Z',
		groupId: 'group-home',
		sortOrderInGroup: 0,
		role: 'OWNER',
	},
	{
		id: 'list-work',
		name: 'Roadmap',
		emoji: null,
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2026-01-01T00:00:00Z',
		groupId: 'group-work',
		sortOrderInGroup: 0,
		role: 'OWNER',
	},
	{
		id: 'list-ungrouped',
		name: 'Personal',
		emoji: null,
		description: null,
		defaultSortField: 'MANUAL',
		defaultSortDirection: 'ASC',
		createdAt: '2026-01-01T00:00:00Z',
		groupId: null,
		sortOrderInGroup: 0,
		role: 'OWNER',
	},
];

describe('ListsPage add-group form layout matches ListForm', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		storeMocks.getLists.mockReturnValue([]);
		storeMocks.getListGroups.mockReturnValue([]);
		storeMocks.reorderListGroupsOptimistic.mockResolvedValue(undefined);
	});

	async function openAddGroupForm() {
		const { container } = render(ListsPage, { props: { } });
		const newGroupBtn = Array.from(container.querySelectorAll('button')).find(
			(b) => b.textContent?.trim() === '+ New group',
		)!;
		await fireEvent.click(newGroupBtn);
		return container;
	}

	it('add-group form should have card container (bg-white rounded-xl border border-gray-200 p-4)', async () => {
		const container = await openAddGroupForm();
		// ListForm wraps everything in a card: bg-white rounded-xl border border-gray-200 p-4
		const card = container.querySelector('.bg-white.rounded-xl.border.border-gray-200.p-4');
		expect(card).not.toBeNull();
	});

	it('add-group form input should be full-width (w-full), not flex-1', async () => {
		const container = await openAddGroupForm();
		const input = container.querySelector('input[placeholder="Group name"]')!;
		expect(input.className).toContain('w-full');
		expect(input.className).not.toContain('flex-1');
	});

	it('add-group form Cancel button should appear before the Add button in the DOM', async () => {
		const container = await openAddGroupForm();
		const buttons = Array.from(container.querySelectorAll('button'));
		const cancelIdx = buttons.findIndex((b) => b.textContent?.trim() === 'Cancel');
		const addIdx = buttons.findIndex((b) => b.textContent?.trim() === 'Add');
		expect(cancelIdx).toBeGreaterThan(-1);
		expect(addIdx).toBeGreaterThan(-1);
		expect(cancelIdx).toBeLessThan(addIdx);
	});

	it('add-group form input should receive focus when form is shown', async () => {
		const container = await openAddGroupForm();
		const input = container.querySelector('input[placeholder="Group name"]') as HTMLInputElement;
		expect(input).not.toBeNull();
		expect(document.activeElement).toBe(input);
	});

	it('refreshes the Today count when the page mounts', () => {
		render(ListsPage, { props: { } });

		expect(loadTodayCount).toHaveBeenCalledOnce();
	});

	it('renders persisted list groups in a sortable zone and keeps Ungrouped outside at the bottom', () => {
		storeMocks.getListGroups.mockReturnValue(groups);
		storeMocks.getLists.mockReturnValue(lists);

		const { container } = render(ListsPage, { props: { } });
		const zone = container.querySelector('[data-testid="list-group-reorder-zone"]') as HTMLElement;

		expect(zone).not.toBeNull();
		expect(zone.textContent).toContain('Home');
		expect(zone.textContent).toContain('Work');
		expect(zone.textContent).not.toContain('Ungrouped');
		expect(container.querySelectorAll('[aria-label="Drag to reorder list group"]')).toHaveLength(2);

		const sectionLabels = Array.from(container.querySelectorAll('button[aria-expanded]')).map(button => button.textContent);
		expect(sectionLabels).toEqual(['▼ Home', '▼ Work', '▼ Ungrouped']);
	});

	it('persists finalized list group wrapper order without affecting list-card drag handles', async () => {
		storeMocks.getListGroups.mockReturnValue(groups);
		storeMocks.getLists.mockReturnValue(lists);

		const { container } = render(ListsPage, { props: { } });
		const zone = container.querySelector('[data-testid="list-group-reorder-zone"]') as HTMLElement;
		await fireEvent(
			zone,
			new CustomEvent('finalize', {
				detail: {
					items: [
						{ id: 'group-work', group: groups[1], lists: [lists[1]] },
						{ id: 'group-home', group: groups[0], lists: [lists[0]] },
					],
				},
				bubbles: true,
			}),
		);

		expect(storeMocks.reorderListGroupsOptimistic).toHaveBeenCalledWith(['group-work', 'group-home']);
		expect(container.querySelectorAll('[aria-label="Drag to reorder"]')).toHaveLength(3);
		expect(container.querySelectorAll('[aria-label="Drag to reorder list group"]')).toHaveLength(2);
	});
});
