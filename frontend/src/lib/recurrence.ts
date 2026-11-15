import type { IntervalUnit, RecurrenceRule } from '$lib/mock-data';

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type Weekday = typeof WEEKDAYS[number];
export interface RecurrenceEditorState {
	mode: string;
	amount: string;
	unit: IntervalUnit;
	weekdays: Weekday[];
}
export const recurrenceOptions = [
	{ value: '', label: 'No recurrence' },
	{ value: '1_DAYS', label: 'Daily' },
	{ value: '1_WEEKS', label: 'Weekly' },
	{ value: '1_MONTHS', label: 'Monthly' },
	{ value: '1_YEARS', label: 'Yearly' },
	{ value: 'WEEKDAYS', label: 'Weekdays' },
	{ value: 'CUSTOM', label: 'Custom' }
];
export const weekdayLabel = (day: string) => day[0] + day.slice(1).toLowerCase();
export const sortedWeekdays = (days: readonly Weekday[]) => WEEKDAYS.filter(day => days.includes(day));
export function recurrenceKey(rule: RecurrenceRule | null): string {
	return rule ? JSON.stringify([rule.intervalUnit, rule.intervalValue, sortedWeekdays(rule.weekdays ?? [])]) : '';
}
export function editorFromRule(rule: RecurrenceRule | null): RecurrenceEditorState {
	if (!rule) return { mode: '', amount: '1', unit: 'DAYS', weekdays: [] };
	const weekdays = sortedWeekdays(rule.weekdays ?? []);
	const mode = weekdays.length && rule.intervalValue === 1 ? 'WEEKDAYS'
		: weekdays.length || rule.intervalValue !== 1 ? 'CUSTOM' : `1_${rule.intervalUnit}`;
	return { mode, amount: String(rule.intervalValue), unit: rule.intervalUnit, weekdays };
}
export function editorFromLegacy(preset: string): RecurrenceEditorState {
	if (!preset) return editorFromRule(null);
	const [amount, unit] = preset.split('_');
	return editorFromRule({ intervalValue: Number(amount), intervalUnit: unit as IntervalUnit });
}
export function recurrenceError(state: RecurrenceEditorState): string | null {
	if (state.mode === 'WEEKDAYS') return state.weekdays.length ? null : 'Select at least one weekday.';
	if (state.mode !== 'CUSTOM') return null;
	if (!/^\d+$/.test(state.amount) || Number(state.amount) < 1 || Number(state.amount) > 2147483647) {
		return 'Enter a whole number from 1 to 2147483647.';
	}
	return null;
}
export function ruleFromEditor(state: RecurrenceEditorState): RecurrenceRule | null {
	if (recurrenceError(state)) throw new Error(recurrenceError(state)!);
	if (!state.mode) return null;
	if (state.mode !== 'CUSTOM' && state.mode !== 'WEEKDAYS') {
		const [value, unit] = state.mode.split('_');
		return { intervalValue: Number(value), intervalUnit: unit as IntervalUnit };
	}
	const weekly = state.mode === 'WEEKDAYS';
	const rule: RecurrenceRule = { intervalValue: weekly ? 1 : Number(state.amount), intervalUnit: weekly ? 'WEEKS' : state.unit };
	if (rule.intervalUnit === 'WEEKS' && state.weekdays.length) rule.weekdays = sortedWeekdays(state.weekdays);
	return rule;
}

export function ruleFromDraft(state: RecurrenceEditorState, applied?: RecurrenceRule | null): RecurrenceRule | null {
	if (applied !== undefined) return applied;
	return recurrenceError(state) ? null : ruleFromEditor(state);
}
