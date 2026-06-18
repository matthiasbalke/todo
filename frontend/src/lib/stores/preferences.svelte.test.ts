import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/users', () => ({
	getMe: vi.fn(),
	updatePreferences: vi.fn(),
}));

import { getMe, updatePreferences } from '$lib/api/users';
import { loadPreferences } from './preferences.svelte';

const profile = {
	id: 'u1',
	email: 'u@example.com',
	displayName: 'User',
	timeZone: 'UTC',
	timeZoneInitialized: false,
	todayViewEnabled: true,
};

describe('preference initialization', () => {
	beforeEach(() => vi.clearAllMocks());

	it('initializes an uninitialized account once from the browser timezone', async () => {
		vi.mocked(getMe).mockResolvedValue(profile);
		vi.mocked(updatePreferences).mockResolvedValue({ ...profile, timeZone: 'Europe/Berlin', timeZoneInitialized: true });
		vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) } as Intl.DateTimeFormat);
		await loadPreferences();
		expect(updatePreferences).toHaveBeenCalledWith({ timeZone: 'Europe/Berlin', todayViewEnabled: true });
	});

	it('preserves an initialized explicit timezone', async () => {
		vi.mocked(getMe).mockResolvedValue({ ...profile, timeZone: 'UTC', timeZoneInitialized: true });
		await loadPreferences();
		expect(updatePreferences).not.toHaveBeenCalled();
	});
});
