import { beforeEach, describe, expect, it, vi } from 'vitest';

const events = vi.hoisted(() => [] as string[]);

vi.mock('$lib/api/admin', () => ({
	getAdminSettings: vi.fn(async () => {
		events.push('settings');
		return { registrationEnabled: true };
	}),
	getAdminStats: vi.fn(async () => {
		events.push('stats');
		return { users: 1, admins: 1, blockedUsers: 0, lists: 0, todoItems: 0 };
	}),
	getAdminUsers: vi.fn(async () => {
		events.push('users');
		return [];
	}),
}));

import { getAdminSettings } from '$lib/api/admin';
import { load } from './+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('admin page load', () => {
	beforeEach(() => {
		events.length = 0;
		vi.clearAllMocks();
	});

	it('waits for protected parent layout before loading admin data', async () => {
		const parent = vi.fn(async () => {
			events.push('parent');
			return {};
		});

		await expect(load({ fetch: fetchFn, parent } as never)).resolves.toMatchObject({
			settings: { registrationEnabled: true },
			stats: { users: 1 },
			users: [],
		});

		expect(parent).toHaveBeenCalled();
		expect(getAdminSettings).toHaveBeenCalledWith(fetchFn);
		expect(events[0]).toBe('parent');
		expect(events.slice(1).sort()).toEqual(['settings', 'stats', 'users']);
	});
});
