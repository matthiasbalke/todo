import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, User } from '$lib/mock-data';
import QuickAddItemForm from './QuickAddItemForm.svelte';

const categories: Category[] = [
	{ id: 'category-1', listId: 'list-1', name: 'Groceries', color: '#60a5fa', sortOrder: 1 },
	{ id: 'category-2', listId: 'list-1', name: 'Household', color: null, sortOrder: 2 }
];

const users: User[] = [
	{ id: 'u1', name: 'Alice', email: 'alice@example.com' },
	{ id: 'u2', name: '', email: 'bob@example.com' }
];

const defaultProps = {
	listId: 'list-1',
	categories,
	users,
	onsubmit: vi.fn(),
	oncancel: vi.fn()
};

describe('QuickAddItemForm', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 9, 12));
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('renders a title entry and ordered icon controls', () => {
		render(QuickAddItemForm, { props: defaultProps });

		expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveFocus();
		const details = screen.getByTestId('quick-add-detail-controls');
		expect(details).toHaveClass('quick-add-detail-scroll', 'flex-nowrap', 'overflow-x-auto');
		expect(details).not.toHaveClass('flex-wrap');
		const controls = within(details).getAllByRole('button');
		expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
			'Category',
			'Due date',
			'Recurrence',
			'Assignees',
			'Notes'
		]);
		for (const control of controls) {
			expect(control.querySelector('svg')).not.toBeNull();
			expect(control).toHaveClass('shrink-0');
		}
		expect(screen.queryByRole('button', { name: 'Mark done' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Star' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
	});

	it('initializes from a draft and emits cloned draft changes', async () => {
		const onDraftChange = vi.fn();
		render(QuickAddItemForm, {
			props: {
				...defaultProps,
				onDraftChange,
				draft: {
					title: 'Draft title',
					notes: 'Draft notes',
					dueDate: '2026-06-15',
					categoryId: 'category-1',
					assignedUserIds: ['u1'],
					recurrencePreset: '1_WEEKS',
					done: true,
					starred: true
				}
			}
		});
		onDraftChange.mockClear();

		expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveValue('Draft title');
		expect(screen.getByRole('button', { name: 'Category' })).toHaveTextContent('Groceries');
		expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('Jun 15, 2026');
		expect(screen.getByRole('button', { name: 'Recurrence' })).toHaveTextContent('Every week');
		expect(screen.getByRole('button', { name: 'Assignees' })).toHaveTextContent('Alice');
		expect(screen.getByRole('button', { name: 'Notes' })).toHaveTextContent('Notes');
		const categoryPill = screen.getByRole('button', { name: 'Category' }).parentElement;
		expect(categoryPill).toHaveClass(
			'h-6',
			'rounded-full',
			'border',
			'border-primary-soft',
			'bg-primary-surface',
			'text-xs',
			'text-primary-strong'
		);
		expect(screen.getByRole('button', { name: 'Clear Category value' })).toHaveClass(
			'h-full',
			'w-6',
			'border-l',
			'border-primary-soft'
		);

		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), {
			target: { value: 'Changed title' }
		});

		const emitted = onDraftChange.mock.calls.at(-1)?.[0];
		expect(emitted).toMatchObject({
			title: 'Changed title',
			notes: 'Draft notes',
			dueDate: '2026-06-15',
			categoryId: 'category-1',
			assignedUserIds: ['u1'],
			recurrencePreset: '1_WEEKS',
			done: false,
			starred: false
		});
		expect(emitted.assignedUserIds).not.toBe(onDraftChange.mock.calls.at(-2)?.[0]?.assignedUserIds);
	});

	it('clears saved detail values from the pill remove buttons', async () => {
		const onDraftChange = vi.fn();
		const oncancel = vi.fn();
		render(QuickAddItemForm, {
			props: {
				...defaultProps,
				onDraftChange,
				oncancel,
				draft: {
					title: 'Draft title',
					notes: 'Draft notes',
					dueDate: '2026-06-15',
					categoryId: 'category-1',
					assignedUserIds: ['u1'],
					recurrencePreset: '1_WEEKS',
					done: false,
					starred: false
				}
			}
		});
		onDraftChange.mockClear();

		const clearCategory = screen.getByRole('button', { name: 'Clear Category value' });
		await fireEvent.mouseDown(clearCategory);
		fireEvent.focusOut(clearCategory, { relatedTarget: null });
		await fireEvent.click(clearCategory);
		await vi.runAllTimersAsync();
		await fireEvent.click(screen.getByRole('button', { name: 'Clear Due date value' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Clear Recurrence value' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Clear Assignees value' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Clear Notes value' }));

		expect(screen.getByRole('button', { name: 'Category' })).not.toHaveTextContent('Groceries');
		expect(screen.getByRole('button', { name: 'Due date' })).not.toHaveTextContent('Jun 15, 2026');
		expect(screen.getByRole('button', { name: 'Recurrence' })).not.toHaveTextContent('Every week');
		expect(screen.getByRole('button', { name: 'Assignees' })).not.toHaveTextContent('Alice');
		expect(screen.getByRole('button', { name: 'Notes' })).not.toHaveTextContent('Notes');
		expect(onDraftChange.mock.calls.at(-1)?.[0]).toMatchObject({
			notes: '',
			dueDate: null,
			categoryId: null,
			assignedUserIds: [],
			recurrencePreset: ''
		});
		expect(oncancel).not.toHaveBeenCalled();
		expect(screen.getByRole('textbox', { name: 'Item title' })).toBeInTheDocument();
	});

	it('submits title-only items with existing empty-value contracts and resets after success', async () => {
		const onsubmit = vi.fn().mockResolvedValue(undefined);
		render(QuickAddItemForm, { props: { ...defaultProps, onsubmit } });

		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), {
			target: { value: 'Buy milk' }
		});
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });

		expect(onsubmit).toHaveBeenCalledOnce();
		expect(onsubmit.mock.calls[0][0]).toMatchObject({
			listId: 'list-1',
			title: 'Buy milk',
			notes: null,
			categoryId: null,
			dueDate: null,
			assignedUserIds: [],
			recurrenceRule: null,
			done: false,
			starred: false,
			sortOrder: 999,
			createdAt: '2026-06-09',
			updatedAt: '2026-06-09'
		});
		await waitFor(() => expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveValue(''));
	});

	it('preserves the draft after failed submit', async () => {
		const onsubmit = vi.fn().mockRejectedValue(new Error('boom'));
		render(QuickAddItemForm, { props: { ...defaultProps, onsubmit } });

		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), {
			target: { value: 'Retry item' }
		});
		await openNotes();
		await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
			target: { value: 'Retry notes' }
		});
		await saveDialog('Notes');
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });

		expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveValue('Retry item');
		expect(screen.getByRole('button', { name: 'Notes' })).toHaveTextContent('Notes');
	});

	it('saves, cancels, clears, and returns focus for detail dialogs', async () => {
		render(QuickAddItemForm, { props: defaultProps });

		const categoryTrigger = screen.getByRole('button', { name: 'Category' });
		await fireEvent.click(categoryTrigger);
		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Groceries' }));
		await saveDialog('Category');
		await vi.runAllTimersAsync();
		const savedCategoryTrigger = screen.getByRole('button', { name: 'Category' });
		expect(savedCategoryTrigger).toHaveTextContent('Groceries');
		expect(document.activeElement).toBe(savedCategoryTrigger);

		await fireEvent.click(savedCategoryTrigger);
		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Uncategorized' }));
		await cancelDialog('Category');
		await vi.runAllTimersAsync();
		expect(screen.getByRole('button', { name: 'Category' })).toHaveTextContent('Groceries');

		await fireEvent.click(screen.getByRole('button', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Uncategorized' }));
		await saveDialog('Category');
		await vi.runAllTimersAsync();
		expect(screen.getByRole('button', { name: 'Category' })).not.toHaveTextContent('Groceries');

		const dueDateTrigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(dueDateTrigger);
		let dialog = screen.getByRole('dialog', { name: 'Due date' });
		await fireEvent.click(within(dialog).getByRole('button', { name: 'Due date' }));
		await fireEvent.click(within(dialog).getByRole('gridcell', { name: 'Monday, June 15, 2026' }));
		await saveDialog('Due date');
		await vi.runAllTimersAsync();
		const savedDueDateTrigger = screen.getByRole('button', { name: 'Due date' });
		expect(savedDueDateTrigger).toHaveTextContent('Jun 15, 2026');
		expect(document.activeElement).toBe(savedDueDateTrigger);

		await fireEvent.click(savedDueDateTrigger);
		dialog = screen.getByRole('dialog', { name: 'Due date' });
		await fireEvent.click(within(dialog).getByRole('button', { name: 'Due date' }));
		await fireEvent.click(within(dialog).getByRole('button', { name: 'Clear' }));
		await saveDialog('Due date');
		expect(dueDateTrigger).not.toHaveTextContent('Jun 15, 2026');
	});

	it('submits saved optional dialog details and discards canceled assignee and notes changes', async () => {
		const onsubmit = vi.fn();
		render(QuickAddItemForm, { props: { ...defaultProps, onsubmit } });

		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), {
			target: { value: 'Detailed item' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Household' }));
		await saveDialog('Category');
		await fireEvent.click(screen.getByRole('button', { name: 'Recurrence' }));
		await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Every month' }));
		await saveDialog('Recurrence');
		await fireEvent.click(screen.getByRole('button', { name: 'Assignees' }));
		await fireEvent.keyDown(screen.getByRole('combobox', { name: 'Assignees' }), { key: 'Enter' });
		await fireEvent.click(screen.getByRole('option', { name: 'Alice' }));
		await fireEvent.click(screen.getByRole('option', { name: 'bob@example.com' }));
		await saveDialog('Assignees');
		await openNotes();
		await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
			target: { value: 'Saved notes' }
		});
		await saveDialog('Notes');

		await fireEvent.click(screen.getByRole('button', { name: 'Assignees' }));
		await fireEvent.keyDown(screen.getByRole('combobox', { name: 'Assignees' }), { key: 'Enter' });
		await fireEvent.click(screen.getByRole('option', { name: 'Alice' }));
		await cancelDialog('Assignees');
		await openNotes();
		await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
			target: { value: 'Discarded notes' }
		});
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), { key: 'Escape' });

		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });

		expect(onsubmit.mock.calls[0][0]).toMatchObject({
			title: 'Detailed item',
			notes: 'Saved notes',
			categoryId: 'category-2',
			assignedUserIds: ['u1', 'u2'],
			recurrenceRule: { intervalValue: 1, intervalUnit: 'MONTHS' }
		});
	});

	it('submits no recurrence when the recurrence dialog saves the empty preset', async () => {
		const onsubmit = vi.fn();
		render(QuickAddItemForm, {
			props: {
				...defaultProps,
				onsubmit,
				draft: {
					title: '',
					notes: '',
					dueDate: null,
					categoryId: null,
					assignedUserIds: [],
					recurrencePreset: '1_DAYS',
					done: false,
					starred: false
				}
			}
		});

		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), {
			target: { value: 'No longer recurring' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Recurrence' }));
		await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
		await fireEvent.click(screen.getByRole('option', { name: 'No recurrence' }));
		await saveDialog('Recurrence');
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });

		expect(onsubmit.mock.calls[0][0].recurrenceRule).toBeNull();
	});
});

async function openNotes() {
	await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
	expect(screen.getByRole('dialog', { name: 'Notes' })).toBeInTheDocument();
}

async function saveDialog(name: string) {
	await fireEvent.click(within(screen.getByRole('dialog', { name })).getByRole('button', { name: 'Save' }));
}

async function cancelDialog(name: string) {
	const dialog = screen.getByRole('dialog', { name });
	const cancelButtons = within(dialog).getAllByRole('button', { name: 'Cancel' });
	await fireEvent.click(cancelButtons.at(-1)!);
}
