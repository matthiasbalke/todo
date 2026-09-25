import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/users', () => ({
	getMe: vi.fn(),
	updatePreferences: vi.fn(),
}));

import { getMe, updatePreferences } from '$lib/api/users';
import { THEME_PREFERENCE_CACHE_KEY } from '$lib/themePreferenceCache';
import { loadPreferences, savePreferences } from './preferences.svelte';

const profile = {
	id: 'u1',
	email: 'u@example.com',
	displayName: 'User',
	timeZone: 'UTC',
	timeZoneInitialized: false,
	todayViewEnabled: true,
	themePreference: 'SYSTEM' as const,
};

describe('preference initialization', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('initializes an uninitialized account once from the browser timezone', async () => {
		vi.mocked(getMe).mockResolvedValue(profile);
		vi.mocked(updatePreferences).mockResolvedValue({ ...profile, timeZone: 'Europe/Berlin', timeZoneInitialized: true });
		vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) } as Intl.DateTimeFormat);
		await loadPreferences();
		expect(updatePreferences).toHaveBeenCalledWith({ timeZone: 'Europe/Berlin', todayViewEnabled: true, themePreference: 'SYSTEM' });
	});

	it('preserves an initialized explicit timezone', async () => {
		vi.mocked(getMe).mockResolvedValue({ ...profile, timeZone: 'UTC', timeZoneInitialized: true });
		await loadPreferences();
		expect(updatePreferences).not.toHaveBeenCalled();
	});

	it('normalizes missing theme values from older-looking test data', async () => {
		vi.mocked(getMe).mockResolvedValue({
			...profile,
			themePreference: undefined,
			timeZoneInitialized: true,
		} as never);
		const loaded = await loadPreferences();
		expect(loaded.themePreference).toBe('SYSTEM');
	});

	it('refreshes the startup theme cache after loading the profile', async () => {
		vi.mocked(getMe).mockResolvedValue({
			...profile,
			themePreference: 'DARK',
			timeZoneInitialized: true,
		});

		await loadPreferences();

		expect(localStorage.getItem(THEME_PREFERENCE_CACHE_KEY)).toBe('DARK');
	});

	it('refreshes the startup theme cache after a successful preference update', async () => {
		vi.mocked(updatePreferences).mockResolvedValue({
			...profile,
			themePreference: 'LIGHT',
			timeZoneInitialized: true,
		});

		await savePreferences('UTC', true, 'LIGHT');

		expect(localStorage.getItem(THEME_PREFERENCE_CACHE_KEY)).toBe('LIGHT');
	});
});
