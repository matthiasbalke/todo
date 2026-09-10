import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, TodoItem, User } from '$lib/mock-data';
import { setProfile } from '$lib/stores/preferences.svelte';
import ItemForm, { NOTES_PREVIEW_LIMIT } from './ItemForm.svelte';

const defaultProps = {
	listId: 'list-1',
	categories: [],
	users: [],
	onsubmit: vi.fn(),
	oncancel: vi.fn()
};

function itemWithDueDate(dueDate: string | null): TodoItem {
	return {
		id: 'item-1',
		listId: 'list-1',
		categoryId: null,
		title: 'Existing item',
		notes: null,
		done: false,
		starred: false,
		dueDate,
		assignedUserIds: [],
		recurrenceRule: null,
		parentItemId: null,
		createdByUserId: null,
		updatedByUserId: null,
		sortOrder: 1,
		createdAt: '2026-06-01T00:00:00Z',
		updatedAt: '2026-06-01T00:00:00Z'
	};
}

function itemWithCategory(categoryId: string | null): TodoItem {
	return { ...itemWithDueDate(null), categoryId };
}

function itemWithRecurrence(
	intervalValue: number,
	intervalUnit: NonNullable<TodoItem['recurrenceRule']>['intervalUnit']
): TodoItem {
	return {
		...itemWithDueDate(null),
		recurrenceRule: { intervalValue, intervalUnit }
	};
}

const categories: Category[] = [
	{ id: 'category-1', listId: 'list-1', name: 'Groceries', color: '#60a5fa', sortOrder: 1 },
	{ id: 'category-2', listId: 'list-1', name: 'Household', color: null, sortOrder: 2 }
];

describe('ItemForm', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 9, 12));
		setProfile({
			id: 'user-1',
			email: 'alice@example.com',
			displayName: 'Alice',
			timeZone: 'UTC',
			timeZoneInitialized: true,
			todayViewEnabled: true
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe('state toggles', () => {
		it('renders completion before the title and star after the title, then submits toggled values', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			const doneButton = screen.getByRole('button', { name: 'Mark done' });
			const titleInput = screen.getByRole('textbox', { name: 'Item title' });
			const starButton = screen.getByRole('button', { name: 'Star' });
			expect(doneButton.compareDocumentPosition(titleInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			expect(titleInput.compareDocumentPosition(starButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

			await fireEvent.input(titleInput, { target: { value: 'Stateful item' } });
			await fireEvent.click(doneButton);
			await fireEvent.click(starButton);
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0]).toMatchObject({
				title: 'Stateful item',
				done: true,
				starred: true
			});
		});

		it('initializes existing completion and star state and submits later changes', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, item: { ...itemWithDueDate(null), done: true, starred: true }, onsubmit }
			});

			await fireEvent.click(screen.getByRole('button', { name: 'Mark undone' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Unstar' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			expect(onsubmit.mock.calls[0][0]).toMatchObject({
				done: false,
				starred: false
			});
		});
	});

	describe('category', () => {
		it('renders audit rows below the notes field for existing items', () => {
			const users: User[] = [{ id: 'user-1', name: 'Alice', email: 'alice@example.com' }];
			const item = {
				...itemWithDueDate(null),
				notes: 'Existing note',
				createdByUserId: 'missing-user-id',
				updatedByUserId: 'user-1',
				createdAt: '2026-01-01T10:01:02Z',
				updatedAt: '2026-02-01T15:31:02Z'
			};
			const { container } = render(ItemForm, {
				props: { ...defaultProps, item, users }
			});

			const notesField = screen.getByRole('button', { name: 'Notes' });
			const audit = screen.getByTestId('item-audit-metadata');
			expect(audit).toHaveTextContent(/Sun\. 1\. Feb 26 at 15:31\s*updated by Alice/);
			expect(audit).toHaveTextContent(/Thu\. 1\. Jan 26 at 10:01\s*created by Deleted user/);
			expect(audit).not.toHaveTextContent('missing-user-id');
			expect(audit).toHaveClass('text-center');
			expect(audit.querySelectorAll('p.grid-cols-\\[3\\.75rem_1fr\\]')).toHaveLength(0);
			expect(notesField.compareDocumentPosition(audit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			expect(container.textContent).toMatch(/Sun\. 1\. Feb 26 at 15:31\s*updated by Alice\s*Thu\. 1\. Jan 26 at 10:01\s*created by Deleted user/);
		});

		it('renders CategorySelect with category labels and color state instead of a native category select', async () => {
			const { container } = render(ItemForm, {
				props: { ...defaultProps, categories }
			});

			const trigger = screen.getByRole('combobox', { name: 'Category' });
			expect(trigger).toHaveValue('assign category');
			expect(trigger).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal');
			expect(trigger.parentElement).toHaveClass('min-h-10', 'px-3', 'py-2');
			expect(container.querySelector('label[for="categoryId"]')).not.toBeInTheDocument();
			expect(container.querySelector('select#categoryId')).not.toBeInTheDocument();

			await fireEvent.click(trigger);
			const uncategorized = screen.getByRole('option', { name: 'Uncategorized' });
			const groceries = screen.getByRole('option', { name: 'Groceries' });
			const household = screen.getByRole('option', { name: 'Household' });
			expect(within(uncategorized).getByTestId('category-select-swatch-uncategorized')).toHaveClass(
				'h-3',
				'w-3'
			);
			expect(within(groceries).getByTestId('category-select-swatch-category-1')).toHaveClass(
				'rounded-full'
			);
			expect(within(household).getByTestId('category-select-swatch-category-2')).toHaveClass(
				'h-3',
				'w-3'
			);
		});

		it.each([
			['existing category', itemWithCategory('category-2'), undefined, 'Household'],
			['uncategorized item', itemWithCategory(null), undefined, 'assign category'],
			['new-item default', undefined, 'category-1', 'Groceries'],
			['stale new-item default', undefined, 'missing-category', 'assign category'],
			['stale category', itemWithCategory('missing-category'), undefined, 'missing-category']
		])('initializes from the %s', (_name, item, defaultCategoryId, label) => {
			render(ItemForm, {
				props: { ...defaultProps, categories, item, defaultCategoryId }
			});

			expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(label);
		});

		it('submits a stale new-item default as Uncategorized', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, categories, defaultCategoryId: 'missing-category', onsubmit }
			});

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Uncategorized fallback item' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].categoryId).toBeNull();
		});

		it('selects a category with a pointer and submits its ID without cancelling', async () => {
			const onsubmit = vi.fn();
			const oncancel = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, categories, onsubmit, oncancel }
			});

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Categorized item' }
			});
			const trigger = screen.getByRole('combobox', { name: 'Category' });
			await fireEvent.click(trigger);
			await fireEvent.click(screen.getByRole('option', { name: 'Household' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].categoryId).toBe('category-2');
			expect(oncancel).not.toHaveBeenCalled();
		});

		it('keeps duplicate category names distinct by submitted ID', async () => {
			const onsubmit = vi.fn();
			const duplicateCategories: Category[] = [
				{ id: 'first-id', listId: 'list-1', name: 'Duplicate', color: null, sortOrder: 1 },
				{ id: 'second-id', listId: 'list-1', name: 'Duplicate', color: null, sortOrder: 2 }
			];
			render(ItemForm, {
				props: { ...defaultProps, categories: duplicateCategories, onsubmit }
			});

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Duplicate category item' }
			});
			await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
			await fireEvent.click(screen.getAllByRole('option', { name: 'Duplicate' })[1]);
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].categoryId).toBe('second-id');
		});

		it('submits Uncategorized as null', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: {
					...defaultProps,
					categories,
					item: itemWithCategory('category-1'),
					onsubmit
				}
			});

			await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
			await fireEvent.click(screen.getByRole('option', { name: 'Uncategorized' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			expect(onsubmit.mock.calls[0][0].categoryId).toBeNull();
		});

		it.each([
			['configured default', 'category-1', 'Groceries'],
			['stale default', 'missing-category', 'assign category'],
			['empty category', undefined, 'assign category']
		])('resets to %s after creating an item', async (_name, defaultCategoryId, label) => {
			const onsubmit = vi.fn().mockResolvedValue(undefined);
			render(ItemForm, {
				props: { ...defaultProps, categories, defaultCategoryId, onsubmit }
			});

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Reset category item' }
			});
			const trigger = screen.getByRole('combobox', { name: 'Category' });
			await fireEvent.click(trigger);
			await fireEvent.click(screen.getByRole('option', { name: 'Household' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(trigger).toHaveValue(label);
		});

		it('supports keyboard selection and Escape dismissal without cancelling', async () => {
			const oncancel = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, categories, oncancel }
			});
			const trigger = screen.getByRole('combobox', { name: 'Category' });
			trigger.focus();

			await fireEvent.keyDown(trigger, { key: 'Enter' });
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await fireEvent.keyDown(trigger, { key: 'Enter' });
			expect(trigger).toHaveValue('Groceries');
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.keyDown(trigger, { key: 'Enter' });
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await fireEvent.keyDown(trigger, { key: 'Escape' });
			expect(screen.queryByRole('listbox', { name: 'Category' })).not.toBeInTheDocument();
			expect(trigger).toHaveValue('Groceries');
			expect(document.activeElement).toBe(trigger);
			expect(oncancel).not.toHaveBeenCalled();
		});
	});

	describe('recurrence', () => {
		it('renders the shared Select with every recurrence label instead of a native select', async () => {
			const { container } = render(ItemForm, { props: defaultProps });
			const trigger = screen.getByRole('combobox', { name: 'Recurrence' });

			expect(trigger).toHaveValue('set recurrence');
			expect(trigger).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal');
			expect(trigger.parentElement).toHaveClass('min-h-10', 'px-3', 'py-2');
			expect(trigger).toHaveClass('text-gray-500', 'italic');
			expect(container.querySelector('select#recurrencePreset')).not.toBeInTheDocument();

			await fireEvent.click(trigger);
			expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
				'No recurrence',
				'Every day',
				'Every week',
				'Every 2 weeks',
				'Every month',
				'Every 3 months',
				'Every year'
			]);
		});

		it.each([
			['daily', itemWithRecurrence(1, 'DAYS'), 'Every day'],
			['weekly', itemWithRecurrence(1, 'WEEKS'), 'Every week'],
			['biweekly', itemWithRecurrence(2, 'WEEKS'), 'Every 2 weeks'],
			['monthly', itemWithRecurrence(1, 'MONTHS'), 'Every month'],
			['quarterly', itemWithRecurrence(3, 'MONTHS'), 'Every 3 months'],
			['yearly', itemWithRecurrence(1, 'YEARS'), 'Every year'],
			['no recurrence', itemWithDueDate(null), 'set recurrence'],
			['unsupported recurrence', itemWithRecurrence(4, 'WEEKS'), 'set recurrence']
		])('initializes the %s recurrence state', (_name, item, label) => {
			render(ItemForm, { props: { ...defaultProps, item } });

			expect(screen.getByRole('combobox', { name: 'Recurrence' })).toHaveValue(label);
		});

		it.each([
			['Every day', 1, 'DAYS'],
			['Every week', 1, 'WEEKS'],
			['Every 2 weeks', 2, 'WEEKS'],
			['Every month', 1, 'MONTHS'],
			['Every 3 months', 3, 'MONTHS'],
			['Every year', 1, 'YEARS']
		])('submits %s as its recurrence rule', async (label, intervalValue, intervalUnit) => {
			const onsubmit = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Recurring item' }
			});
			await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
			await fireEvent.click(screen.getByRole('option', { name: label }));
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({
				intervalValue,
				intervalUnit
			});
		});

		it('submits recurrence placeholder as null', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: {
					...defaultProps,
					item: itemWithRecurrence(1, 'DAYS'),
					onsubmit
				}
			});

			await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
			await fireEvent.click(screen.getByRole('option', { name: 'No recurrence' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			expect(onsubmit.mock.calls[0][0].recurrenceRule).toBeNull();
		});

		it('selects with a pointer without cancelling and resets after creation', async () => {
			const onsubmit = vi.fn().mockResolvedValue(undefined);
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit, oncancel } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Reset recurrence item' }
			});
			const trigger = screen.getByRole('combobox', { name: 'Recurrence' });
			await fireEvent.click(trigger);
			await fireEvent.click(screen.getByRole('option', { name: 'Every month' }));
			expect(trigger).toHaveValue('Every month');
			expect(trigger).not.toHaveClass('text-gray-500', 'italic');
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({
				intervalValue: 1,
				intervalUnit: 'MONTHS'
			});
			expect(trigger).toHaveValue('set recurrence');
			expect(oncancel).not.toHaveBeenCalled();
		});

		it('supports keyboard selection and Escape dismissal without cancelling', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const trigger = screen.getByRole('combobox', { name: 'Recurrence' });
			trigger.focus();

			await fireEvent.keyDown(trigger, { key: 'Enter' });
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await fireEvent.keyDown(trigger, { key: 'Enter' });
			expect(trigger).toHaveValue('Every day');
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.keyDown(trigger, { key: 'Enter' });
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await fireEvent.keyDown(trigger, { key: 'Escape' });
			expect(screen.queryByRole('listbox', { name: 'Recurrence' })).not.toBeInTheDocument();
			expect(trigger).toHaveValue('Every day');
			expect(document.activeElement).toBe(trigger);
			expect(oncancel).not.toHaveBeenCalled();
		});
	});

	describe('assignees', () => {
		it('uses MultiSelect with avatar rendering and toggles selected users', async () => {
			const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
			const { container } = render(ItemForm, { props: { ...defaultProps, users: [user] } });

			const trigger = screen.getByRole('combobox', { name: 'Assignees' });
			expect(trigger).toHaveValue('');
			expect(trigger).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal');
			expect(trigger.parentElement).toHaveClass('min-h-10', 'px-3', 'py-2');
			expect(trigger).toHaveAttribute('placeholder', 'add assignee');
			expect(container.querySelector('label[for="assignedUserIds"]')).not.toBeInTheDocument();
			expect(container.querySelector('fieldset')).not.toBeInTheDocument();

			await fireEvent.click(trigger);
			const option = screen.getByRole('option', { name: 'Alice' });
			expect(option).toHaveTextContent('A');
			await fireEvent.click(option);
			expect(trigger.parentElement).toHaveTextContent('Alice');

			await fireEvent.click(screen.getByRole('option', { name: 'Alice' }));
			expect(trigger.parentElement).not.toHaveTextContent('Alice');
		});
	});

	describe('due date', () => {
		it('renders the shared DatePicker instead of a native date input', () => {
			const { container } = render(ItemForm, { props: defaultProps });

			const dueDate = screen.getByRole('button', { name: 'Due Date' });
			expect(dueDate).toHaveTextContent('set due date');
			expect(dueDate).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal');
			expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument();
		});

		it('displays and selects an existing due date', async () => {
			render(ItemForm, {
				props: { ...defaultProps, item: itemWithDueDate('2026-06-09') }
			});

			const trigger = screen.getByRole('button', { name: 'Due Date' });
			expect(trigger).toHaveTextContent('Jun 9, 2026');
			await fireEvent.click(trigger);
			expect(
				screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' })
			).toHaveAttribute('aria-selected', 'true');
		});

		it('displays the placeholder for an existing item without a due date', () => {
			render(ItemForm, {
				props: { ...defaultProps, item: itemWithDueDate(null) }
			});

			expect(screen.getByRole('button', { name: 'Due Date' })).toHaveTextContent('set due date');
		});

		it('submits a selected ISO date', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Dated item' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Due Date' }));
			await fireEvent.click(
				screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' })
			);
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit).toHaveBeenCalledOnce();
			expect(onsubmit.mock.calls[0][0]).toMatchObject({
				title: 'Dated item',
				dueDate: '2026-06-15'
			});
		});

		it('submits null after clearing an existing due date', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, item: itemWithDueDate('2026-06-09'), onsubmit }
			});

			await fireEvent.click(screen.getByRole('button', { name: 'Due Date' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			expect(onsubmit).toHaveBeenCalledOnce();
			expect(onsubmit.mock.calls[0][0].dueDate).toBeNull();
		});

		it('resets the due date after successfully creating an item', async () => {
			const onsubmit = vi.fn().mockResolvedValue(undefined);
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Dated item' }
			});
			const trigger = screen.getByRole('button', { name: 'Due Date' });
			await fireEvent.click(trigger);
			await fireEvent.click(
				screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' })
			);
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(trigger).toHaveTextContent('set due date');
		});
	});

	describe('notes', () => {
		it('submits multiline notes from the shared Textarea', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Document item' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
			const notes = screen.getByRole('textbox', { name: 'Notes' });
			await fireEvent.input(notes, { target: { value: 'First line\nSecond line' } });
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(notes).toHaveAttribute('rows', '14');
			expect(notes).toHaveClass('resize-none');
			expect(onsubmit.mock.calls[0][0].notes).toBe('First line\nSecond line');
		});

		it('submits null for empty notes', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, {
				props: { ...defaultProps, item: itemWithDueDate(null), onsubmit }
			});

			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			expect(onsubmit.mock.calls[0][0].notes).toBeNull();
		});

		it('does not cancel when focus moves between notes and another form control', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
			const notes = screen.getByRole('textbox', { name: 'Notes' });
			const title = screen.getByPlaceholderText('Item title');

			fireEvent.focusOut(notes, { relatedTarget: title });

			expect(oncancel).not.toHaveBeenCalled();
		});

		it('renders absent, short, and truncated notes previews without normalizing whitespace', () => {
			render(ItemForm, { props: defaultProps });
			const emptyNotesTrigger = screen.getByRole('button', { name: 'Notes' });
			const emptyNotesPreview = screen.getByTestId('item-form-notes-preview');
			expect(emptyNotesTrigger).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal', 'min-h-10');
			expect(screen.getByRole('button', { name: 'Notes' }).parentElement?.previousElementSibling).toHaveClass('mt-2.5');
			expect(emptyNotesTrigger).not.toHaveClass('items-start');
			expect(emptyNotesPreview).toHaveClass('font-sans', 'text-sm', 'leading-5', 'text-gray-500', 'italic');
			expect(emptyNotesTrigger).toHaveTextContent('add note');
			cleanup();

			render(ItemForm, {
				props: { ...defaultProps, item: { ...itemWithDueDate(null), notes: 'First line\nSecond line' } }
			});
			expect(screen.getByRole('button', { name: 'Notes' })).toHaveClass('min-h-24', 'items-start');
			expect(screen.getByTestId('item-form-notes-preview').textContent).toBe('First line\nSecond line');
			expect(screen.getByTestId('item-form-notes-open-cue')).toHaveTextContent('open');
			cleanup();

			const longNotes = `${'a'.repeat(NOTES_PREVIEW_LIMIT)}tail`;
			render(ItemForm, {
				props: { ...defaultProps, item: { ...itemWithDueDate(null), notes: longNotes } }
			});
			const preview = screen.getByRole('button', { name: 'Notes' });
			expect(screen.getByTestId('item-form-notes-preview').textContent).toBe(`${'a'.repeat(NOTES_PREVIEW_LIMIT)}...`);
			expect(preview).not.toHaveTextContent(longNotes);
		});

		it('shows the complete long notes only inside fullscreen editing', async () => {
			const longNotes = `${'a'.repeat(NOTES_PREVIEW_LIMIT)}tail`;
			render(ItemForm, {
				props: { ...defaultProps, item: { ...itemWithDueDate(null), notes: longNotes } }
			});

			expect(screen.getByRole('button', { name: 'Notes' })).not.toHaveTextContent(longNotes);
			await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));

			expect(screen.getByRole('dialog', { name: 'Notes' })).toBeInTheDocument();
			expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue(longNotes);
		});

		it('saves, cancels, handles Escape, returns focus, and keeps form cancel untouched', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const trigger = screen.getByRole('button', { name: 'Notes' });

			await fireEvent.click(trigger);
			let dialog = screen.getByRole('dialog', { name: 'Notes' });
			expect(within(dialog).getByRole('button', { name: 'Cancel' }).querySelector('svg')).toHaveClass('lucide-chevron-left');
			expect(within(dialog).getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
			expect(within(dialog).getByRole('button', { name: 'Save' })).toBeInTheDocument();
			expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Notes' }));
			await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
				target: { value: 'Saved\nnotes' }
			});
			await fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
			await vi.runAllTimersAsync();
			expect(screen.queryByRole('dialog', { name: 'Notes' })).not.toBeInTheDocument();
			expect(screen.getByTestId('item-form-notes-preview').textContent).toBe('Saved\nnotes');
			expect(document.activeElement).toBe(trigger);

			await fireEvent.click(trigger);
			dialog = screen.getByRole('dialog', { name: 'Notes' });
			await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
				target: { value: 'Discarded' }
			});
			await fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
			await vi.runAllTimersAsync();
			expect(screen.getByTestId('item-form-notes-preview').textContent).toBe('Saved\nnotes');
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.click(trigger);
			await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
				target: { value: 'Escape discard' }
			});
			await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), { key: 'Escape' });
			await vi.runAllTimersAsync();
			expect(screen.getByTestId('item-form-notes-preview').textContent).toBe('Saved\nnotes');
			expect(oncancel).not.toHaveBeenCalled();
		});
	});

	describe('focusout and cancellation', () => {
		it('initializes a new-item form from a draft', () => {
			render(ItemForm, {
				props: {
					...defaultProps,
					categories,
					users: [{ id: 'u1', name: 'Alice', email: 'alice@example.com' }],
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

			expect(screen.getByPlaceholderText('Item title')).toHaveValue('Draft title');
			expect(screen.getByRole('button', { name: 'Notes' })).toHaveTextContent('Draft notes');
			expect(screen.getByRole('button', { name: 'Due Date' })).toHaveTextContent('Jun 15, 2026');
			expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Groceries');
			expect(screen.getByRole('combobox', { name: 'Assignees' })).toHaveValue('');
			expect(screen.getByRole('combobox', { name: 'Recurrence' })).toHaveValue('Every week');
			expect(screen.getByRole('button', { name: 'Mark undone' })).toHaveAttribute('aria-pressed', 'true');
			expect(screen.getByRole('button', { name: 'Unstar' })).toHaveAttribute('aria-pressed', 'true');
		});

		it('emits cloned draft changes for new-item fields', async () => {
			const onDraftChange = vi.fn();
			render(ItemForm, {
				props: {
					...defaultProps,
					categories,
					users: [{ id: 'u1', name: 'Alice', email: 'alice@example.com' }],
					onDraftChange
				}
			});
			onDraftChange.mockClear();

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Draft item' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
			await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
				target: { value: 'Remember this' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
			await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
			await fireEvent.click(screen.getByRole('option', { name: 'Household' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Due Date' }));
			await fireEvent.click(
				screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' })
			);
			await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
			await fireEvent.click(screen.getByRole('option', { name: 'Every month' }));
			await fireEvent.click(screen.getByRole('combobox', { name: 'Assignees' }));
			await fireEvent.click(screen.getByRole('option', { name: 'Alice' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Star' }));

			const lastDraft = onDraftChange.mock.calls.at(-1)?.[0];
			expect(lastDraft).toEqual({
				title: 'Draft item',
				notes: 'Remember this',
				dueDate: '2026-06-15',
				categoryId: 'category-2',
				assignedUserIds: ['u1'],
				recurrencePreset: '1_MONTHS',
				done: true,
				starred: true
			});
			expect(lastDraft.assignedUserIds).not.toBe(onDraftChange.mock.calls.at(-2)?.[0].assignedUserIds);
		});

		it('does not cancel when mousedown within the form is followed by a null focus target', () => {
			const oncancel = vi.fn();
			const { container } = render(ItemForm, { props: { ...defaultProps, oncancel } });
			const form = container.querySelector('form')!;
			const titleInput = screen.getByPlaceholderText('Item title');

			fireEvent.mouseDown(form);
			fireEvent.focusOut(titleInput, { relatedTarget: null });

			expect(oncancel).not.toHaveBeenCalled();
		});

		it('cancels with a focusout reason when focus moves outside the form', () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const externalElement = document.createElement('button');
			document.body.appendChild(externalElement);

			fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
				relatedTarget: externalElement
			});

			expect(oncancel).toHaveBeenCalledOnce();
			expect(oncancel).toHaveBeenCalledWith({ reason: 'focusout' });
			externalElement.remove();
		});

		it('cancels with an explicit reason when Cancel is activated', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });

			await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

			expect(oncancel).toHaveBeenCalledOnce();
			expect(oncancel).toHaveBeenCalledWith({ reason: 'explicit' });
		});

		it('keeps draft values visible when new-item submission fails', async () => {
			const onsubmit = vi.fn().mockRejectedValue(new Error('boom'));
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Retry this item' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
			await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), {
				target: { value: 'Still needed' }
			});
			await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(screen.getByPlaceholderText('Item title')).toHaveValue('Retry this item');
			expect(screen.getByRole('button', { name: 'Notes' })).toHaveTextContent('Still needed');
		});

		it('does not cancel when focus moves between form controls', () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });

			fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
				relatedTarget: screen.getByRole('button', { name: 'Notes' })
			});

			expect(oncancel).not.toHaveBeenCalled();
		});

		it('keeps the form open while navigating the calendar and dismissing it with Escape', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const trigger = screen.getByRole('button', { name: 'Due Date' });

			await fireEvent.click(trigger);
			await fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
			expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument();
			expect(oncancel).not.toHaveBeenCalled();

			const focusedDate = document.activeElement as HTMLElement;
			await fireEvent.keyDown(focusedDate, { key: 'Escape' });
			await vi.runAllTimersAsync();

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(document.activeElement).toBe(trigger);
			expect(oncancel).not.toHaveBeenCalled();
		});

		it('keeps the form open and returns focus after selecting and clearing', async () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const trigger = screen.getByRole('button', { name: 'Due Date' });

			await fireEvent.click(trigger);
			await fireEvent.click(
				screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' })
			);
			await vi.runAllTimersAsync();
			expect(document.activeElement).toBe(trigger);
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.click(trigger);
			await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
			await vi.runAllTimersAsync();
			expect(document.activeElement).toBe(trigger);
			expect(oncancel).not.toHaveBeenCalled();
		});
	});
});
