import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, TodoItem } from '$lib/mock-data';
import ItemForm from './ItemForm.svelte';

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
		sortOrder: 1,
		createdAt: '2026-06-01'
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
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe('category', () => {
		it('renders CategorySelect with category labels and color state instead of a native category select', async () => {
			const { container } = render(ItemForm, {
				props: { ...defaultProps, categories }
			});

			const trigger = screen.getByRole('combobox', { name: 'Category' });
			expect(trigger).toHaveValue('Uncategorized');
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
			['uncategorized item', itemWithCategory(null), undefined, 'Uncategorized'],
			['new-item default', undefined, 'category-1', 'Groceries'],
			['stale new-item default', undefined, 'missing-category', 'Uncategorized'],
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
			['stale default', 'missing-category', 'Uncategorized'],
			['Uncategorized', undefined, 'Uncategorized']
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

			expect(trigger).toHaveValue('No recurrence');
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
			['no recurrence', itemWithDueDate(null), 'No recurrence'],
			['unsupported recurrence', itemWithRecurrence(4, 'WEEKS'), 'No recurrence']
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

		it('submits No recurrence as null', async () => {
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
			expect(oncancel).not.toHaveBeenCalled();

			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({
				intervalValue: 1,
				intervalUnit: 'MONTHS'
			});
			expect(trigger).toHaveValue('No recurrence');
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

	describe('assignment chips', () => {
		it('toggles a chip to selected state and back', async () => {
			const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
			const { container } = render(ItemForm, { props: { ...defaultProps, users: [user] } });

			const chip = screen.getByRole('button', { name: 'Alice' });
			expect(chip).toHaveClass('bg-white', 'border-gray-300');

			await fireEvent.click(chip);
			expect(chip.className).toContain('bg-blue-100');

			await fireEvent.click(chip);
			expect(chip).toHaveClass('bg-white', 'border-gray-300');

			const fieldset = container.querySelector('fieldset')!;
			expect(fieldset.className).not.toContain('m-0');
		});
	});

	describe('due date', () => {
		it('renders the shared DatePicker instead of a native date input', () => {
			const { container } = render(ItemForm, { props: defaultProps });

			expect(screen.getByRole('button', { name: 'Due Date' })).toHaveTextContent('Select a date');
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

			expect(screen.getByRole('button', { name: 'Due Date' })).toHaveTextContent('Select a date');
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

			expect(trigger).toHaveTextContent('Select a date');
		});
	});

	describe('notes', () => {
		it('submits multiline notes from the shared Textarea', async () => {
			const onsubmit = vi.fn();
			render(ItemForm, { props: { ...defaultProps, onsubmit } });

			await fireEvent.input(screen.getByPlaceholderText('Item title'), {
				target: { value: 'Document item' }
			});
			const notes = screen.getByRole('textbox', { name: 'Notes' });
			await fireEvent.input(notes, { target: { value: 'First line\nSecond line' } });
			await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

			expect(notes).toHaveAttribute('rows', '2');
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

		it('does not cancel when focus moves between notes and another form control', () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const notes = screen.getByRole('textbox', { name: 'Notes' });
			const title = screen.getByPlaceholderText('Item title');

			fireEvent.focusOut(notes, { relatedTarget: title });

			expect(oncancel).not.toHaveBeenCalled();
		});
	});

	describe('focusout and cancellation', () => {
		it('does not cancel when mousedown within the form is followed by a null focus target', () => {
			const oncancel = vi.fn();
			const { container } = render(ItemForm, { props: { ...defaultProps, oncancel } });
			const form = container.querySelector('form')!;
			const titleInput = screen.getByPlaceholderText('Item title');

			fireEvent.mouseDown(form);
			fireEvent.focusOut(titleInput, { relatedTarget: null });

			expect(oncancel).not.toHaveBeenCalled();
		});

		it('cancels when focus moves outside the form', () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });
			const externalElement = document.createElement('button');
			document.body.appendChild(externalElement);

			fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
				relatedTarget: externalElement
			});

			expect(oncancel).toHaveBeenCalledOnce();
			externalElement.remove();
		});

		it('does not cancel when focus moves between form controls', () => {
			const oncancel = vi.fn();
			render(ItemForm, { props: { ...defaultProps, oncancel } });

			fireEvent.focusOut(screen.getByPlaceholderText('Item title'), {
				relatedTarget: screen.getByRole('textbox', { name: 'Notes' })
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
