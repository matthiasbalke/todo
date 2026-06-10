import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TodoItem } from '$lib/mock-data';
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

	describe('assignment chips', () => {
		it('toggles a chip to selected state and back', async () => {
			const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
			const { container } = render(ItemForm, { props: { ...defaultProps, users: [user] } });

			const chip = screen.getByRole('button', { name: 'Alice' });
			expect(chip.className).toContain('bg-gray-100');

			await fireEvent.click(chip);
			expect(chip.className).toContain('bg-blue-100');

			await fireEvent.click(chip);
			expect(chip.className).toContain('bg-gray-100');

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

		it.each([
			['category', '#categoryId'],
			['recurrence', '#recurrencePreset']
		])('preserves the %s picker blur workaround', (_name, selector) => {
			const { container } = render(ItemForm, { props: defaultProps });
			const select = container.querySelector(selector)!;
			const titleInput = screen.getByPlaceholderText('Item title');

			fireEvent.blur(select);

			expect(document.activeElement).toBe(titleInput);
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
