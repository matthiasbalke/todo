import { beforeEach, describe, expect, it, vi } from 'vitest';

const events = vi.hoisted(() => [] as string[]);
const emailSettings = vi.hoisted(() => ({
	source: 'DEPLOYMENT' as const,
	enabled: false,
	authEnabled: false,
	host: '',
	port: null,
	protocol: 'smtp',
	encryption: 'STARTTLS' as const,
	username: null,
	passwordConfigured: false,
	from: '',
	fromName: 'Todo',
	validationErrors: [],
}));
const appSettings = vi.hoisted(() => ({
	registrationEnabled: true,
	publicBaseUrl: 'http://localhost:5173',
}));

vi.mock('$lib/api/admin', () => ({
	getAdminSettings: vi.fn(async () => {
		events.push('settings');
		return { app: appSettings, email: emailSettings };
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
vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => ({ id: 'admin-1', displayName: 'Admin', email: 'admin@example.com', admin: true })),
}));

import { getAdminSettings, getAdminStats, getAdminUsers } from '$lib/api/admin';
import { getCurrentUser } from '$lib/stores/auth.svelte';
import { load as loadAdminEntry } from './+page';
import { load as loadAdminLayout } from './+layout';
import { load as loadSettings } from './settings/+page';
import { load as loadUsers } from './users/+page';

const fetchFn = vi.fn() as unknown as typeof fetch;

describe('admin route loads', () => {
	beforeEach(() => {
		events.length = 0;
		vi.clearAllMocks();
	});

	it('redirects the admin entry route to settings after the protected parent layout', async () => {
		const parent = vi.fn(async () => {
			events.push('parent');
			return {};
		});

		await expect(loadAdminEntry({ fetch: fetchFn, parent } as never)).rejects.toMatchObject({
			status: 307,
			location: '/admin/settings',
		});
		expect(parent).toHaveBeenCalled();
		expect(events).toEqual(['parent']);
	});

	it('exposes the active admin path from the shared layout', async () => {
		const parent = vi.fn(async () => {
			events.push('parent');
			return {};
		});

		await expect(loadAdminLayout({
			parent,
			url: new URL('https://todo.example/admin/users'),
		} as never)).resolves.toEqual({ activeAdminPath: '/admin/users' });

		expect(parent).toHaveBeenCalled();
	});

	it('rejects non-admin users from the shared admin layout', async () => {
		vi.mocked(getCurrentUser).mockReturnValueOnce({
			id: 'user-1',
			displayName: 'User',
			email: 'user@example.com',
			admin: false,
		});
		const parent = vi.fn(async () => ({}));

		await expect(loadAdminLayout({
			parent,
			url: new URL('https://todo.example/admin/settings'),
		} as never)).rejects.toMatchObject({
			status: 403,
			body: { message: 'Admin access required' },
		});
	});

	it('waits for protected layouts before loading settings data only', async () => {
		const parent = vi.fn(async () => {
			events.push('parent');
			return {};
		});

		await expect(loadSettings({ fetch: fetchFn, parent } as never)).resolves.toMatchObject({
			settings: { app: appSettings, email: emailSettings },
		});

		expect(parent).toHaveBeenCalled();
		expect(getAdminSettings).toHaveBeenCalledWith(fetchFn);
		expect(getAdminStats).not.toHaveBeenCalled();
		expect(getAdminUsers).not.toHaveBeenCalled();
		expect(events).toEqual(['parent', 'settings']);
	});

	it('waits for protected layouts before loading users data only', async () => {
		const parent = vi.fn(async () => {
			events.push('parent');
			return {};
		});

		await expect(loadUsers({ fetch: fetchFn, parent } as never)).resolves.toMatchObject({
			stats: { users: 1 },
			users: [],
		});

		expect(parent).toHaveBeenCalled();
		expect(getAdminSettings).not.toHaveBeenCalled();
		expect(getAdminStats).toHaveBeenCalledWith(fetchFn);
		expect(getAdminUsers).toHaveBeenCalledWith(fetchFn);
		expect(events[0]).toBe('parent');
		expect(events.slice(1).sort()).toEqual(['stats', 'users']);
	});
});
