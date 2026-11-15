import { describe, expect, it } from 'vitest';
import { editorFromRule, editorFromLegacy, recurrenceError, recurrenceKey, ruleFromEditor, type RecurrenceEditorState } from './recurrence';
import { recurrenceRuleToHuman } from './utils';
import type { RecurrenceRule } from './mock-data';

describe('recurrence editor contract', () => {
	it.each<RecurrenceRule>([
		{ intervalValue: 1, intervalUnit: 'DAYS' },
		{ intervalValue: 1, intervalUnit: 'WEEKS' },
		{ intervalValue: 1, intervalUnit: 'MONTHS' },
		{ intervalValue: 1, intervalUnit: 'YEARS' },
		{ intervalValue: 2, intervalUnit: 'WEEKS' },
		{ intervalValue: 3, intervalUnit: 'MONTHS' },
		{ intervalValue: 4, intervalUnit: 'WEEKS' },
		{ intervalValue: 1, intervalUnit: 'WEEKS', weekdays: ['MONDAY', 'THURSDAY'] },
		{ intervalValue: 2, intervalUnit: 'WEEKS', weekdays: ['MONDAY', 'THURSDAY'] },
	])('initializes and round trips $intervalValue $intervalUnit with $weekdays', rule => {
		expect(ruleFromEditor(editorFromRule(rule))).toEqual(rule);
	});
	it('decodes legacy drafts and canonicalizes weekday order', () => {
		expect(editorFromLegacy('2_WEEKS')).toMatchObject({ mode: 'CUSTOM', amount: '2', unit: 'WEEKS' });
		expect(editorFromLegacy('3_MONTHS')).toMatchObject({ mode: 'CUSTOM', amount: '3', unit: 'MONTHS' });
		const a: RecurrenceRule = { intervalValue: 2, intervalUnit: 'WEEKS', weekdays: ['THURSDAY', 'MONDAY'] };
		const b: RecurrenceRule = { ...a, weekdays: ['MONDAY', 'THURSDAY'] };
		expect(recurrenceKey(a)).toBe(recurrenceKey(b));
		expect(recurrenceRuleToHuman(a)).toBe('Every 2 weeks on Monday and Thursday');
		expect(recurrenceRuleToHuman(a)).toBe(recurrenceRuleToHuman(b));
		expect(recurrenceRuleToHuman({ ...a, intervalValue: 1, weekdays: ['SUNDAY'] })).toBe('Every week on Sunday');
		expect(recurrenceRuleToHuman({ intervalValue: 3, intervalUnit: 'MONTHS' })).toBe('Every 3 months');
	});
	it.each(['', '0', '-1', '1.5', '2147483648', 'NaN'])('keeps invalid raw amount %s without producing a rule', amount => {
		const state: RecurrenceEditorState = { mode: 'CUSTOM', amount, unit: 'DAYS', weekdays: [] };
		expect(recurrenceError(state)).toBeTruthy();
		expect(() => ruleFromEditor(state)).toThrow();
	});
	it('requires a day only for Weekdays mode and resets to none', () => {
		expect(recurrenceError({ mode: 'WEEKDAYS', amount: '1', unit: 'WEEKS', weekdays: [] })).toBeTruthy();
		expect(ruleFromEditor({ mode: 'CUSTOM', amount: '2', unit: 'WEEKS', weekdays: [] })).toEqual({ intervalValue: 2, intervalUnit: 'WEEKS' });
		expect(ruleFromEditor(editorFromRule(null))).toBeNull();
	});
});
