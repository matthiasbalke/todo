import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ItemForm from './ItemForm.svelte';
import QuickAddItemForm from './QuickAddItemForm.svelte';
import type { ItemFormDraft } from './ItemForm.svelte';
import type { TodoItem, RecurrenceRule } from '$lib/mock-data';

const basic = { listId: 'l1', categories: [], users: [], oncancel: vi.fn() };
const weekdays: RecurrenceRule = { intervalValue: 1, intervalUnit: 'WEEKS', weekdays: ['MONDAY', 'THURSDAY'] };
const item = (rule: RecurrenceRule | null = weekdays): TodoItem => ({
	id: 'i1', listId: 'l1', categoryId: null, title: 'Repeat task', notes: null,
	dueDate: '2026-11-02', done: false, starred: false, assignedUserIds: [], recurrenceRule: rule,
	parentItemId: null, createdByUserId: null, updatedByUserId: null, sortOrder: 0,
	createdAt: '2026-11-01', updatedAt: '2026-11-01'
});
const dialog = () => within(screen.getByRole('dialog', { name: 'Recurrence' }));
async function selectMode(label: string, quick = false) {
	if (quick) await fireEvent.click(screen.getByRole('button', { name: 'Recurrence' }));
	await fireEvent.click(screen.getByRole('combobox', { name: 'Recurrence' }));
	await fireEvent.click(screen.getByRole('option', { name: label }));
}
async function chooseUnit(label: string) {
	await fireEvent.click(dialog().getByRole('combobox', { name: 'Repeat unit' }));
	await fireEvent.click(screen.getByRole('option', { name: label }));
}
async function close() { await fireEvent.click(dialog().getByRole('button', { name: 'Close' })); }
afterEach(cleanup);

describe('custom recurrence in quick-add', () => {
	it('keeps Custom open, applies an interval, and creates on Enter with its complete rule', async () => {
		const onsubmit = vi.fn();
		render(QuickAddItemForm, { props: { ...basic, onsubmit } });
		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), { target: { value: 'Quarterly task' } });
		await selectMode('Custom', true);
		await fireEvent.input(dialog().getByRole('textbox', { name: 'Repeat every' }), { target: { value: '3' } });
		await fireEvent.blur(dialog().getByRole('textbox', { name: 'Repeat every' }));
		await chooseUnit('months');
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		await close();
		expect(screen.getByRole('button', { name: 'Recurrence' })).toHaveTextContent('Every 3 months');
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });
		expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({ intervalUnit: 'MONTHS', intervalValue: 3 });
	});
	it.each(['close', 'escape', 'outside'])('stages weekday edits until %s and retains focus', async dismissal => {
		const onDraftChange = vi.fn();
		render(QuickAddItemForm, { props: { ...basic, onsubmit: vi.fn(), onDraftChange } });
		await selectMode('Weekdays', true);
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Monday' }));
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Thursday' }));
		expect(onDraftChange.mock.calls.at(-1)?.[0].appliedRecurrenceRule).toBeNull();
		if (dismissal === 'close') await close();
		else if (dismissal === 'escape') await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		else await fireEvent.pointerDown(screen.getByRole('dialog').parentElement!);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(onDraftChange.mock.calls.at(-1)?.[0].appliedRecurrenceRule).toEqual(weekdays);
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Recurrence' })));
		expect(basic.oncancel).not.toHaveBeenCalled();
	});
	it('preserves invalid raw input through dismissal and minimize/reopen and blocks creation', async () => {
		const onDraftChange = vi.fn(), onsubmit = vi.fn();
		const rendered = render(QuickAddItemForm, { props: { ...basic, onsubmit, onDraftChange } });
		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), { target: { value: 'Incomplete' } });
		await selectMode('Custom', true);
		await fireEvent.input(dialog().getByRole('textbox', { name: 'Repeat every' }), { target: { value: '' } });
		await close();
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });
		expect(onsubmit).not.toHaveBeenCalled();
		const draft = onDraftChange.mock.calls.at(-1)![0] as ItemFormDraft;
		expect(draft.recurrenceEditor).toMatchObject({ mode: 'CUSTOM', amount: '' });
		rendered.unmount();
		render(QuickAddItemForm, { props: { ...basic, onsubmit, draft } });
		await fireEvent.click(screen.getByRole('button', { name: 'Recurrence' }));
		expect(dialog().getByRole('textbox', { name: 'Repeat every' })).toHaveValue('');
		expect(dialog().getByRole('alert')).toHaveTextContent('whole number');
		expect(dialog().getByRole('textbox', { name: 'Repeat every' })).toHaveAttribute('aria-describedby', dialog().getByRole('alert').id);
	});
	it('keeps an invalid weekday draft recoverable, and chip removal clears the entire rule', async () => {
		const onsubmit = vi.fn();
		render(QuickAddItemForm, { props: { ...basic, onsubmit } });
		await selectMode('Weekdays', true);
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Sunday' }));
		await close();
		expect(screen.getByRole('button', { name: 'Recurrence' })).toHaveTextContent('Sunday');
		await fireEvent.click(screen.getByRole('button', { name: 'Recurrence' }));
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Sunday' }));
		await close();
		expect(screen.getByRole('alert')).toHaveTextContent('at least one weekday');
		await fireEvent.click(screen.getByRole('button', { name: 'Clear Recurrence value' }));
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		await selectMode('Weekdays', true);
		expect(dialog().getAllByRole('checkbox').every(input => !(input as HTMLInputElement).checked)).toBe(true);
	});
	it('retains a complete rule after failure, then resets all fields after successful creation', async () => {
		const onsubmit = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
		const onDraftChange = vi.fn();
		render(QuickAddItemForm, { props: { ...basic, onsubmit, onDraftChange } });
		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), { target: { value: 'Retry' } });
		await selectMode('Weekdays', true);
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Monday' }));
		await close();
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });
		expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveValue('Retry');
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });
		expect(onsubmit.mock.calls[1][0].recurrenceRule.weekdays).toEqual(['MONDAY']);
		expect(screen.getByRole('textbox', { name: 'Item title' })).toHaveValue('');
		await selectMode('Custom', true);
		expect(dialog().getByRole('textbox', { name: 'Repeat every' })).toHaveValue('1');
		expect(dialog().queryByRole('checkbox')).not.toBeInTheDocument();
	});
});

describe('existing item recurrence automatic saving', () => {
	it('preserves a custom rule on a title edit', async () => {
		const onsubmit = vi.fn();
		render(ItemForm, { props: { ...basic, item: item({ intervalValue: 4, intervalUnit: 'WEEKS' }), onsubmit } });
		expect(screen.getByRole('combobox', { name: 'Recurrence' })).toHaveValue('Every 4 weeks');
		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), { target: { value: 'New title' } });
		await fireEvent.blur(screen.getByRole('textbox', { name: 'Item title' }));
		expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({ intervalValue: 4, intervalUnit: 'WEEKS' });
	});
	it('saves only the final weekday set once and suppresses unchanged close', async () => {
		const onsubmit = vi.fn();
		render(ItemForm, { props: { ...basic, item: item(), onsubmit } });
		await selectMode('Weekdays');
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Monday' }));
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Friday' }));
		expect(onsubmit).not.toHaveBeenCalled();
		await close();
		await waitFor(() => expect(onsubmit).toHaveBeenCalledTimes(1));
		expect(onsubmit.mock.calls[0][0].recurrenceRule.weekdays).toEqual(['THURSDAY', 'FRIDAY']);
		await selectMode('Weekdays');
		await close();
		expect(onsubmit).toHaveBeenCalledTimes(1);
	});
	it('does not save on opening Custom and retains invalid input across unrelated echoes', async () => {
		const onsubmit = vi.fn();
		const rendered = render(ItemForm, { props: { ...basic, item: item(), onsubmit } });
		await selectMode('Custom');
		expect(onsubmit).not.toHaveBeenCalled();
		await fireEvent.input(dialog().getByRole('textbox', { name: 'Repeat every' }), { target: { value: '1.5' } });
		await close();
		expect(onsubmit).not.toHaveBeenCalled();
		await rendered.rerender({ ...basic, item: { ...item(), updatedAt: '2026-11-02' }, onsubmit });
		await selectMode('Custom');
		expect(dialog().getByRole('textbox', { name: 'Repeat every' })).toHaveValue('1.5');
		await close();
		await fireEvent.input(screen.getByRole('textbox', { name: 'Item title' }), { target: { value: 'Keep rule' } });
		await fireEvent.blur(screen.getByRole('textbox', { name: 'Item title' }));
		expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual(weekdays);
	});
	it('retries failed weekday saves on close without losing the configured input', async () => {
		const onsubmit = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
		render(ItemForm, { props: { ...basic, item: item(), onsubmit } });
		await selectMode('Weekdays');
		await fireEvent.click(dialog().getByRole('checkbox', { name: 'Sunday' }));
		await close();
		await waitFor(() => expect(screen.getByText('Changes could not be saved.')).toBeInTheDocument());
		await selectMode('Weekdays');
		expect(dialog().getByRole('checkbox', { name: 'Sunday' })).toBeChecked();
		await close();
		await waitFor(() => expect(onsubmit).toHaveBeenCalledTimes(2));
		expect(onsubmit.mock.calls[1][0].recurrenceRule.weekdays).toEqual(['MONDAY', 'THURSDAY', 'SUNDAY']);
	});
});


describe('custom draft compatibility', () => {
	it.each([ItemForm, QuickAddItemForm])('restores a complete editor draft without a last-applied-rule field', async Component => {
		const onsubmit = vi.fn();
		const draft: ItemFormDraft = {
			title: 'Restored custom task', notes: '', categoryId: null, dueDate: null,
			assignedUserIds: [], done: false, starred: false, recurrencePreset: 'CUSTOM',
			recurrenceEditor: { mode: 'CUSTOM', amount: '3', unit: 'MONTHS', weekdays: [] }
		};
		render(Component, { props: { ...basic, onsubmit, draft } });
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'Item title' }), { key: 'Enter' });
		expect(onsubmit.mock.calls[0][0].recurrenceRule).toEqual({ intervalValue: 3, intervalUnit: 'MONTHS' });
	});
});
