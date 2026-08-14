import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
	authenticated: false,
	events: [] as string[],
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	restoreSession: vi.fn(async () => {
		authState.events.push('restore');
		return 'unauthenticated';
	}),
	isAuthenticated: vi.fn(() => authState.authenticated),
}));
vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn(async () => {
		authState.events.push('health');
		return true;
	}),
}));
vi.mock('$lib/api/setup', () => ({
	getSetupStatus: vi.fn(async () => {
		authState.events.push('setup');
		return { setupRequired: false };
	}),
}));
vi.mock('$lib/stores/lists.svelte', () => ({
	loadLists: vi.fn(async () => {
		authState.events.push('lists');
	}),
}));
vi.mock('$lib/stores/preferences.svelte', () => ({
	loadPreferences: vi.fn(async () => {
		authState.events.push('preferences');
	}),
}));
vi.mock('$lib/stores/today.svelte', () => ({
	loadTodayCount: vi.fn(async () => {
		authState.events.push('today');
	}),
}));

import { restoreSession } from '$lib/stores/auth.svelte';
import { checkHealth } from '$lib/api/health';
import { getSetupStatus } from '$lib/api/setup';
import { loadLists } from '$lib/stores/lists.svelte';
import { loadPreferences } from '$lib/stores/preferences.svelte';
import { loadTodayCount } from '$lib/stores/today.svelte';
import { load, ssr } from './+layout';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('protected app layout load guard', () => {
	beforeEach(() => {
		authState.authenticated = false;
		authState.events = [];
		vi.clearAllMocks();
		vi.mocked(checkHealth).mockImplementation(async () => {
			authState.events.push('health');
			return true;
		});
		vi.mocked(getSetupStatus).mockImplementation(async () => {
			authState.events.push('setup');
			return { setupRequired: false };
		});
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.events.push('restore');
			return 'unauthenticated';
		});
	});

	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('restores an existing session before loading protected data', async () => {
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.events.push('restore');
			authState.authenticated = true;
			return 'authenticated';
		});

		await expect(load({ fetch: fetchFn } as never)).resolves.toBeUndefined();

		expect(authState.events[0]).toBe('health');
		expect(authState.events[1]).toBe('setup');
		expect(authState.events[2]).toBe('restore');
		expect(loadLists).toHaveBeenCalledWith(fetchFn);
		expect(loadPreferences).toHaveBeenCalledWith(fetchFn);
		expect(loadTodayCount).toHaveBeenCalledWith(fetchFn);
		expect(authState.events.indexOf('today')).toBeGreaterThan(authState.events.indexOf('lists'));
		expect(authState.events.indexOf('today')).toBeGreaterThan(authState.events.indexOf('preferences'));
	});

	it('redirects an unauthenticated user without loading protected data', async () => {
		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/auth',
		});

		expect(restoreSession).toHaveBeenCalledWith(fetchFn);
		expect(loadLists).not.toHaveBeenCalled();
		expect(loadPreferences).not.toHaveBeenCalled();
		expect(loadTodayCount).not.toHaveBeenCalled();
	});

	it('routes to setup before restoring protected routes when setup is required', async () => {
		vi.mocked(getSetupStatus).mockImplementation(async () => {
			authState.events.push('setup');
			return { setupRequired: true };
		});

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/setup',
		});
		expect(restoreSession).not.toHaveBeenCalled();
		expect(loadLists).not.toHaveBeenCalled();
	});

	it('routes backend-unavailable startup through / without loading protected data', async () => {
		vi.mocked(restoreSession).mockImplementation(async () => {
			authState.events.push('restore');
			return 'unavailable';
		});

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/',
		});

		expect(loadLists).not.toHaveBeenCalled();
		expect(loadPreferences).not.toHaveBeenCalled();
		expect(loadTodayCount).not.toHaveBeenCalled();
	});

	it('routes unavailable health through / without restoring or loading protected data', async () => {
		vi.mocked(checkHealth).mockImplementation(async () => {
			authState.events.push('health');
			return false;
		});

		await expect(load({ fetch: fetchFn } as never)).rejects.toMatchObject({
			status: 307,
			location: '/',
		});

		expect(restoreSession).not.toHaveBeenCalled();
		expect(loadLists).not.toHaveBeenCalled();
		expect(loadPreferences).not.toHaveBeenCalled();
		expect(loadTodayCount).not.toHaveBeenCalled();
	});
});
