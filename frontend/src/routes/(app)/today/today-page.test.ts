import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/preferences.svelte', () => ({
	getProfile: vi.fn(() => ({ todayViewEnabled: true })),
}));
vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => ({ id: 'u1' })),
}));

const entries = [
	{
		id: 'editable', listId: 'l1', categoryId: 'c1', title: 'Editable item', notes: null,
		done: false, starred: false, dueDate: '2026-06-13', recurrenceRule: null,
		parentItemId: null, createdByUserId: 'u1', assignedUsers: [{ id: 'u1', displayName: 'User' }],
		sortOrder: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
		sourceListName: 'Editable list', sourceListEmoji: null, sourceListRole: 'OWNER' as const,
		sourceListGroupOrder: 0, sourceListOrder: 0, sourceCategoryName: 'Work',
		sourceCategoryColor: null, sourceCategoryOrder: 0,
	},
	{
		id: 'earlier', listId: 'l1', categoryId: 'c1', title: 'Earlier item', notes: null,
		done: false, starred: true, dueDate: '2026-06-12', recurrenceRule: null,
		parentItemId: null, createdByUserId: 'u1', assignedUsers: [{ id: 'u1', displayName: 'User' }],
		sortOrder: 99, createdAt: '2026-06-02T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z',
		sourceListName: 'Editable list', sourceListEmoji: null, sourceListRole: 'OWNER' as const,
		sourceListGroupOrder: 0, sourceListOrder: 0, sourceCategoryName: 'Work',
		sourceCategoryColor: null, sourceCategoryOrder: 0,
	},
	{
		id: 'viewer', listId: 'l2', categoryId: null, title: 'Viewer item', notes: null,
		done: true, starred: true, dueDate: '2026-06-12', recurrenceRule: null,
		parentItemId: null, createdByUserId: 'u2', assignedUsers: [{ id: 'u1', displayName: 'User' }],
		sortOrder: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
		sourceListName: 'Viewer list', sourceListEmoji: null, sourceListRole: 'VIEWER' as const,
		sourceListGroupOrder: 1, sourceListOrder: 0, sourceCategoryName: null,
		sourceCategoryColor: null, sourceCategoryOrder: null,
	},
];

vi.mock('$lib/stores/today.svelte', async (importOriginal) => {
	const original = await importOriginal<typeof import('$lib/stores/today.svelte')>();
	return {
		...original,
		getTodayEntries: vi.fn(() => entries),
		isTodayLoading: vi.fn(() => false),
		loadToday: vi.fn(),
		refreshToday: vi.fn(),
	};
});

import TodayPage from './+page.svelte';

describe('Today page', () => {
	afterEach(() => {
		cleanup();
		localStorage.clear();
	});

	it('groups by source list, links to sources, and keeps viewer items read-only', async () => {
		render(TodayPage);
		expect(screen.getByRole('link', { name: /Editable list/ })).toHaveAttribute('href', '/lists/l1');
		expect(screen.getByRole('link', { name: /Viewer list/ })).toHaveAttribute('href', '/lists/l2');
		expect(screen.getByRole('link', { name: /Editable item/ })).toHaveAttribute(
			'href',
			'/lists/l1/items/editable?returnTo=%2Ftoday',
		);
		await fireEvent.click(screen.getByRole('button', { name: /1 checked/ }));
		expect(screen.getByText('Viewer item')).toBeInTheDocument();
		expect(screen.getByLabelText('Completed')).toBeInTheDocument();
	});

	it('uses the common burger menu with Filter and Sort submenus', async () => {
		render(TodayPage);

		await fireEvent.click(screen.getByRole('button', { name: 'Today options' }));
		expect(screen.getByRole('button', { name: /Filter/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Sort/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Starred only' })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
		expect(screen.getByRole('button', { name: 'Starred only' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hide checked' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /Sort/ }));
		const alphabetical = screen.getByRole('button', { name: 'Alphabetical' });
		const dueDate = screen.getByRole('button', { name: /^Due date ✓$/ });
		expect(alphabetical.compareDocumentPosition(dueDate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Manual' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Starred only' })).not.toBeInTheDocument();
	});

	it('shows summary state and opens sort controls from the summary', async () => {
		render(TodayPage);

		expect(screen.getByText('3 items')).toBeInTheDocument();
		const summarySort = screen.getByRole('button', { name: 'Change sort order: Due date ↑' });
		expect(summarySort).toHaveTextContent('Sort: Due date ↑');
		expect(screen.queryByRole('button', { name: /Clear .* filter/ })).not.toBeInTheDocument();

		await fireEvent.click(summarySort);
		expect(screen.queryByRole('button', { name: 'Filter' })).not.toBeInTheDocument();
		expect(screen.getByText('Sort by')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Alphabetical' }));
		expect(screen.getByRole('button', { name: 'Change sort order: Alphabetical ↑' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: '↑ Ascending' }));
		expect(screen.getByRole('button', { name: 'Change sort order: Alphabetical ↓' })).toBeInTheDocument();
	});

	it('shows supported filter chips and resets one Today filter at a time', async () => {
		render(TodayPage);

		await fireEvent.click(screen.getByRole('button', { name: 'Today options' }));
		await fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Starred only' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Hide checked' }));

		expect(screen.getByRole('button', { name: 'Clear Starred only filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear Hide checked filter' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Clear .*due.* filter/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Clear .*assigned.* filter/i })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear Hide checked filter' }));

		expect(screen.getByRole('button', { name: 'Clear Starred only filter' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Clear Hide checked filter' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Filter 1 active' })).toBeInTheDocument();
	});

	it('uses Today-specific initial sorting instead of source-list manual order', () => {
		render(TodayPage);

		const earlier = screen.getByRole('link', { name: /Earlier item/ });
		const later = screen.getByRole('link', { name: /Editable item/ });
		expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
