import { beforeEach, describe, expect, it } from 'vitest';
import { loadTodayPrefs, saveTodayPrefs } from './todayPrefs';

describe('Today preferences', () => {
	beforeEach(() => localStorage.clear());

	it('persists state independently per user', () => {
		saveTodayPrefs('u1', {
			sortField: 'DUE_DATE',
			sortDirection: 'DESC',
			starredOnly: true,
			hideDone: true,
			collapsed: { list: true },
			doneCollapsed: {},
		});
		expect(loadTodayPrefs('u1')?.starredOnly).toBe(true);
		expect(loadTodayPrefs('u2')).toBeNull();
	});
});
