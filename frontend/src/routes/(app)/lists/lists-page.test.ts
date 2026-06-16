import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/lists.svelte', () => ({
	getLists: vi.fn(() => []),
	getListGroups: vi.fn(() => []),
	createList: vi.fn(),
	createListGroup: vi.fn(),
	isLoading: vi.fn(() => false),
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

import ListsPage from './+page.svelte';
import { loadTodayCount } from '$lib/stores/today.svelte';

describe('ListsPage add-group form layout matches ListForm', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
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
});
