import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TodoItem, User } from '$lib/mock-data';
import { setProfile } from '$lib/stores/preferences.svelte';
import ItemDetails from './ItemDetails.svelte';

const item: TodoItem = {
	id: 'item-1',
	listId: 'list-1',
	categoryId: null,
	title: 'Apples',
	notes: 'Get Braeburn',
	done: false,
	starred: false,
	dueDate: null,
	assignedUserIds: [],
	recurrenceRule: null,
	parentItemId: null,
	createdByUserId: 'user-1',
	updatedByUserId: 'missing-user-id',
	sortOrder: 0,
	createdAt: '2026-01-01T10:01:02Z',
	updatedAt: '2026-02-01T15:31:02Z',
};

const users: User[] = [
	{ id: 'user-1', name: 'Alice', email: 'alice@example.com' },
];

beforeEach(() => {
	setProfile({
		id: 'user-1',
		email: 'alice@example.com',
		displayName: 'Alice',
		timeZone: 'UTC',
		timeZoneInitialized: true,
		todayViewEnabled: true
	});
});

afterEach(cleanup);

describe('ItemDetails audit metadata', () => {
	it('renders audit rows below notes without exposing unresolved user IDs', () => {
		const { container } = render(ItemDetails, {
			props: { item, categories: [], users },
		});

		const notes = screen.getByText('Get Braeburn');
		const audit = screen.getByTestId('item-audit-metadata');
		expect(audit).toHaveTextContent(/Sun\. 1\. Feb 26 at 15:31\s*updated by Deleted user/);
		expect(audit).toHaveTextContent(/Thu\. 1\. Jan 26 at 10:01\s*created by Alice/);
		expect(audit).not.toHaveTextContent('missing-user-id');
		expect(audit).toHaveClass('text-center');
		expect(audit.querySelectorAll('p.grid-cols-\\[3\\.75rem_1fr\\]')).toHaveLength(0);
		expect(notes.compareDocumentPosition(audit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(container.textContent).toMatch(/Sun\. 1\. Feb 26 at 15:31\s*updated by Deleted user\s*Thu\. 1\. Jan 26 at 10:01\s*created by Alice/);
	});

	it('formats audit timestamps in the persisted user timezone', () => {
		setProfile({
			id: 'user-1',
			email: 'alice@example.com',
			displayName: 'Alice',
			timeZone: 'Europe/Berlin',
			timeZoneInitialized: true,
			todayViewEnabled: true
		});

		render(ItemDetails, {
			props: { item, categories: [], users },
		});

		const audit = screen.getByTestId('item-audit-metadata');
		expect(audit).toHaveTextContent(/Sun\. 1\. Feb 26 at 16:31\s*updated by Deleted user/);
		expect(audit).toHaveTextContent(/Thu\. 1\. Jan 26 at 11:01\s*created by Alice/);
	});
});
