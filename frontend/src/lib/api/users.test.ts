import { describe, expect, it, vi } from 'vitest';

const mockAuthedFetch = vi.hoisted(() => vi.fn());

vi.mock('./authedClient', () => ({
	authedFetch: mockAuthedFetch,
}));

import { getMe, updatePreferences } from './users';

describe('users API client', () => {
	it('gets the authenticated profile through authedFetch', async () => {
		const profile = {
			id: 'u1',
			email: 'user@example.com',
			displayName: 'User',
			timeZone: 'UTC',
			timeZoneInitialized: true,
			todayViewEnabled: true,
			themePreference: 'SYSTEM',
		};
		mockAuthedFetch.mockResolvedValueOnce(profile);

		await expect(getMe()).resolves.toEqual(profile);

		expect(mockAuthedFetch).toHaveBeenCalledWith('/api/users/me', undefined, fetch);
	});

	it('updates all account preferences including themePreference', async () => {
		mockAuthedFetch.mockResolvedValueOnce({
			id: 'u1',
			email: 'user@example.com',
			displayName: 'User',
			timeZone: 'Europe/Berlin',
			timeZoneInitialized: true,
			todayViewEnabled: false,
			themePreference: 'DARK',
		});

		await updatePreferences({
			timeZone: 'Europe/Berlin',
			todayViewEnabled: false,
			themePreference: 'DARK',
		});

		expect(mockAuthedFetch).toHaveBeenCalledWith('/api/users/me/preferences', {
			method: 'PUT',
			body: JSON.stringify({
				timeZone: 'Europe/Berlin',
				todayViewEnabled: false,
				themePreference: 'DARK',
			}),
		});
	});
});
