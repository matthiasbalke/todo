import { describe, expect, it } from 'vitest';
import { quickAddDueDate } from './quickAddItem';

describe('quick-add relative dates', () => {
	it.each([
		['2026-06-08T12:00:00Z', 'UTC', 'Next week', '2026-06-15'],
		['2026-06-14T12:00:00Z', 'UTC', 'Next week', '2026-06-15'],
		['2026-12-31T12:00:00Z', 'UTC', 'Next week', '2027-01-04'],
		['2026-02-28T12:00:00Z', 'UTC', 'Tomorrow', '2026-03-01'],
		['2026-03-28T12:00:00Z', 'Europe/Berlin', 'Next week', '2026-03-30'],
		['2026-10-24T12:00:00Z', 'Europe/Berlin', 'Next week', '2026-10-26'],
		['2026-06-09T01:00:00Z', 'America/Los_Angeles', 'Today', '2026-06-08'],
		['2026-06-08T23:30:00Z', 'Asia/Tokyo', 'Tomorrow', '2026-06-10'],
	])('%s in %s: %s is %s', (now, zone, preset, expected) => {
		expect(quickAddDueDate(preset, zone, new Date(now))).toBe(expected);
	});
});
