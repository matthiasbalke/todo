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
import { saveListGroupState, UNGROUPED_LIST_GROUP_STATE_KEY } from '$lib/listGroupState';

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
		localStorage.clear();
		storeMocks.getLists.mockReturnValue([]);
		storeMocks.getListGroups.mockReturnValue([]);
		storeMocks.reorderListGroupsOptimistic.mockResolvedValue(undefined);
	});

	async function openAddGroupForm() {
		const { container } = render(ListsPage, { props: { } });
		const newGroupBtn = container.querySelector('button[aria-label="Create group"]')!;
		await fireEvent.click(newGroupBtn);
		return container;
	}

	it('add-group form should have card container (bg-surface rounded-xl border border-border p-4)', async () => {
		const container = await openAddGroupForm();
		// ListForm wraps everything in a card: bg-surface rounded-xl border border-border p-4
		const card = container.querySelector('.bg-surface.rounded-xl.border.border-border.p-4');
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

	it('renders creation actions inside the shared fixed action footer with safe-area spacing', () => {
		const { container } = render(ListsPage, { props: { } });

		const footer = container.querySelector('[data-testid="fixed-action-footer"]') as HTMLElement;
		const content = container.querySelector('[data-testid="fixed-action-footer-content"]') as HTMLElement;
		const pageReserve = container.querySelector('.pb-32');
		expect(footer).not.toBeNull();
		expect(footer).toHaveClass('fixed', 'bottom-0', 'border-t', 'bg-surface', 'shadow-lg');
		expect(content).toHaveClass('px-4', 'pt-3', 'max-w-2xl');
		expect(content.className).toContain('pb-[calc(2rem+env(safe-area-inset-bottom))]');
		expect(pageReserve).not.toBeNull();
	});

	it('renders list and group creation actions with Lucide icons and without old labels', () => {
		const { container } = render(ListsPage, { props: { } });
		const newListButton = Array.from(container.querySelectorAll('button')).find((button) =>
			button.textContent?.trim() === 'new list'
		)!;
		const groupButton = container.querySelector('button[aria-label="Create group"]') as HTMLButtonElement;

		expect(newListButton).not.toBeNull();
		expect(newListButton.querySelector('svg')).not.toBeNull();
		expect(groupButton).not.toBeNull();
		expect(groupButton.querySelector('svg')).not.toBeNull();
		expect(container.textContent).not.toContain('+ New list');
		expect(container.textContent).not.toContain('+ New group');
	});

	it('bounds expanded group creation content inside the fixed action footer', async () => {
		const container = await openAddGroupForm();

		const scrollArea = container.querySelector('[data-testid="fixed-action-footer-scroll"]') as HTMLElement;
		expect(scrollArea).not.toBeNull();
		expect(scrollArea).toHaveClass('overflow-y-auto');
		expect(scrollArea.className).toContain('max-h-[min(70vh,calc(100vh-2rem))]');
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

		const sectionLabels = Array.from(container.querySelectorAll('button[aria-expanded]')).map(button => button.textContent?.trim());
		expect(sectionLabels).toEqual(['Home', 'Work', 'Ungrouped']);
		expect(container.querySelectorAll('button[aria-expanded] svg').length).toBeGreaterThanOrEqual(3);
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

	it('restores collapsed state for persisted list groups from local storage', () => {
		storeMocks.getListGroups.mockReturnValue(groups);
		storeMocks.getLists.mockReturnValue(lists);
		saveListGroupState({ collapsed: { 'group-home': true } });

			const { container } = render(ListsPage, { props: { } });
			const labels = Array.from(container.querySelectorAll('button[aria-expanded]')).map(button => ({
				text: button.textContent?.trim(),
				expanded: button.getAttribute('aria-expanded'),
			}));

		expect(labels).toEqual([
			{ text: 'Home', expanded: 'false' },
			{ text: 'Work', expanded: 'true' },
			{ text: 'Ungrouped', expanded: 'true' },
		]);
		expect(container.querySelector('a[href="/lists/list-home"]')).toBeNull();
		expect(container.querySelector('a[href="/lists/list-work"]')).not.toBeNull();
	});

	it('restores collapsed state for the virtual Ungrouped section from local storage', () => {
		storeMocks.getListGroups.mockReturnValue(groups);
		storeMocks.getLists.mockReturnValue(lists);
		saveListGroupState({ collapsed: { [UNGROUPED_LIST_GROUP_STATE_KEY]: true } });

			const { container } = render(ListsPage, { props: { } });
			const labels = Array.from(container.querySelectorAll('button[aria-expanded]')).map(button => ({
				text: button.textContent?.trim(),
				expanded: button.getAttribute('aria-expanded'),
			}));

		expect(labels).toEqual([
			{ text: 'Home', expanded: 'true' },
			{ text: 'Work', expanded: 'true' },
			{ text: 'Ungrouped', expanded: 'false' },
		]);
		expect(container.querySelector('a[href="/lists/list-ungrouped"]')).toBeNull();
	});

	it('saves and clears list group collapsed state when toggled', async () => {
		storeMocks.getListGroups.mockReturnValue(groups);
		storeMocks.getLists.mockReturnValue(lists);

		const { getByRole } = render(ListsPage, { props: { } });
		await fireEvent.click(getByRole('button', { name: /home/i }));

		expect(JSON.parse(localStorage.getItem('todo_list_group_state') ?? '{}')).toEqual({
			collapsed: { 'group-home': true },
		});

		await fireEvent.click(getByRole('button', { name: /home/i }));

		expect(localStorage.getItem('todo_list_group_state')).toBeNull();
	});
});
