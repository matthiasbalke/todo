import { describe, it, expect } from 'vitest';
import { recurrenceRuleToHuman, formatDueDate, isDueDateOverdue, isDueDateToday, applyFilters, applySort } from './utils';

describe('recurrenceRuleToHuman', () => {
  it('formats weekly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'WEEKS', intervalValue: 1 })).toBe('Every week'));
  it('formats bi-weekly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'WEEKS', intervalValue: 2 })).toBe('Every 2 weeks'));
  it('formats daily', () => expect(recurrenceRuleToHuman({ intervalUnit: 'DAYS', intervalValue: 1 })).toBe('Every day'));
  it('formats monthly', () => expect(recurrenceRuleToHuman({ intervalUnit: 'MONTHS', intervalValue: 3 })).toBe('Every 3 months'));
});
