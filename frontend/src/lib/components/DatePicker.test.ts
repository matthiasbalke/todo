import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DatePicker from './DatePicker.svelte';
import {
	addDays,
	createMonthGrid,
	parseIsoDate,
	toIsoDate,
	type CalendarDate
} from './datePicker';

describe('DatePicker', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 9, 12));
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('displays a localized selected value and selected calendar date', async () => {
		render(DatePicker, {
			props: { value: '2026-06-09', label: 'Due date', locale: 'en-US' }
		});

		const trigger = screen.getByRole('button', { name: 'Due date' });
		expect(trigger).toHaveTextContent('Jun 9, 2026');
		await fireEvent.click(trigger);

		expect(
			screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' })
		).toHaveAttribute('aria-selected', 'true');
	});

	it('shows a placeholder for null and renders a Monday-first 42-cell grid', async () => {
		render(DatePicker, {
			props: { value: null, placeholder: 'Choose date', ariaLabel: 'Pick date', locale: 'en-US' }
		});

		const trigger = screen.getByRole('button', { name: 'Pick date' });
		expect(trigger).toHaveTextContent('Choose date');
		await fireEvent.click(trigger);

		const dialog = screen.getByRole('dialog', { name: 'Calendar' });
		const headers = within(dialog).getAllByRole('columnheader');
		expect(headers).toHaveLength(7);
		expect(headers[0]).toHaveTextContent('Mon');
		expect(within(dialog).getAllByRole('gridcell')).toHaveLength(42);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('navigates months without changing the selected value', async () => {
		render(DatePicker, {
			props: { value: '2026-06-09', label: 'Due date', locale: 'en-US' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Due date' }));

		await fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
		expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
		expect(screen.getByRole('heading', { name: 'June 2026' })).toBeInTheDocument();

		await fireEvent.keyDown(
			screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' }),
			{ key: 'Escape' }
		);
		expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('Jun 9, 2026');
	});

	it('selects a date and returns focus to the trigger', async () => {
		render(DatePicker, {
			props: { value: null, label: 'Due date', locale: 'en-US' }
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' }));
		await vi.runAllTimersAsync();

		expect(trigger).toHaveTextContent('Jun 15, 2026');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);
	});

	it('clears a selected date', async () => {
		render(DatePicker, {
			props: {
				value: '2026-06-09',
				label: 'Due date',
				placeholder: 'No due date',
				locale: 'en-US'
			}
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

		expect(trigger).toHaveTextContent('No due date');
	});

	it('selects Today using the local calendar date', async () => {
		render(DatePicker, {
			props: { value: null, label: 'Due date', locale: 'en-US' }
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('button', { name: 'Today' }));

		expect(trigger).toHaveTextContent('Jun 9, 2026');
	});

	it('disables opening and constrained dates', async () => {
		const { rerender } = render(DatePicker, {
			props: { value: null, label: 'Due date', disabled: true, locale: 'en-US' }
		});
		const disabledTrigger = screen.getByRole('button', { name: 'Due date' });
		expect(disabledTrigger).toBeDisabled();
		await fireEvent.click(disabledTrigger);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await rerender({
			value: null,
			label: 'Due date',
			disabled: false,
			min: '2026-06-10',
			max: '2026-06-20',
			locale: 'en-US'
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Due date' }));

		expect(screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' })).toBeDisabled();
		expect(screen.getByRole('gridcell', { name: 'Sunday, June 21, 2026' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
	});

	it('dismisses on outside interaction and Escape without changing the value', async () => {
		render(DatePicker, {
			props: { value: '2026-06-09', label: 'Due date', locale: 'en-US' }
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(trigger);
		await fireEvent.mouseDown(document.body);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(trigger).toHaveTextContent('Jun 9, 2026');

		await fireEvent.click(trigger);
		await fireEvent.keyDown(
			screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' }),
			{ key: 'Escape' }
		);
		await vi.runAllTimersAsync();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);
	});

	it.each([
		['ArrowRight', 'Wednesday, June 10, 2026'],
		['ArrowLeft', 'Monday, June 8, 2026'],
		['ArrowDown', 'Tuesday, June 16, 2026'],
		['ArrowUp', 'Tuesday, June 2, 2026'],
		['Home', 'Monday, June 8, 2026'],
		['End', 'Sunday, June 14, 2026'],
		['PageDown', 'Thursday, July 9, 2026'],
		['PageUp', 'Saturday, May 9, 2026']
	])('moves focus with %s', async (key, expectedLabel) => {
		render(DatePicker, {
			props: { value: '2026-06-09', label: 'Due date', locale: 'en-US' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
		const selected = screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' });

		expect(selected).toHaveAttribute('tabindex', '0');
		await fireEvent.keyDown(selected, { key });

		expect(screen.getByRole('gridcell', { name: expectedLabel })).toHaveFocus();
		expect(screen.getByRole('gridcell', { name: expectedLabel })).toHaveAttribute('tabindex', '0');
	});

	it.each(['Enter', ' '])('selects the focused date with %s', async (key) => {
		render(DatePicker, {
			props: { value: '2026-06-09', label: 'Due date', locale: 'en-US' }
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		await fireEvent.click(trigger);
		const selected = screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' });
		await fireEvent.keyDown(selected, { key: 'ArrowRight' });
		const next = screen.getByRole('gridcell', { name: 'Wednesday, June 10, 2026' });
		await fireEvent.keyDown(next, { key });

		expect(trigger).toHaveTextContent('Jun 10, 2026');
	});

	it('uses label association and calendar ARIA semantics', async () => {
		render(DatePicker, {
			props: { value: null, label: 'Due date', required: true, locale: 'en-US' }
		});
		const trigger = screen.getByRole('button', { name: 'Due date' });
		const label = screen.getByText('Due date');
		expect(trigger).toHaveAttribute('aria-labelledby', label.id);
		expect(label.parentElement).toHaveTextContent('*');

		await fireEvent.click(trigger);
		expect(screen.getByRole('dialog', { name: 'Due date calendar' })).toBeInTheDocument();
		expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
	});
});

describe('DatePicker date helpers', () => {
	it('round-trips ISO dates without UTC conversion', () => {
		const parsed = parseIsoDate('2026-01-02');
		expect(parsed).toEqual({ year: 2026, month: 1, day: 2 });
		expect(toIsoDate(parsed!)).toBe('2026-01-02');
		expect(parseIsoDate('2026-02-30')).toBeNull();
	});

	it('creates a stable Monday-first 42-day grid', () => {
		const grid = createMonthGrid(2026, 6);
		expect(grid).toHaveLength(42);
		expect(toIsoDate(grid[0])).toBe('2026-06-01');
		expect(toIsoDate(grid[41])).toBe('2026-07-12');
	});

	it('adds days using local calendar fields', () => {
		const date: CalendarDate = { year: 2026, month: 3, day: 28 };
		expect(toIsoDate(addDays(date, 1))).toBe('2026-03-29');
	});
});
