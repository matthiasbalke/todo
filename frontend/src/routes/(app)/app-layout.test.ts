import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/api/auth', () => ({ logout: vi.fn() }));
const authState = vi.hoisted(() => ({
	user: { id: 'user-1', displayName: 'Test User', email: 'test@example.com', admin: false },
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	clearSession: vi.fn(),
	getAccessToken: vi.fn(() => null),
	getCurrentUser: vi.fn(() => authState.user),
	refreshIfExpired: vi.fn().mockResolvedValue(true)
}));
vi.mock('$lib/stores/offlineQueue.svelte', () => ({
	flushOfflineQueue: vi.fn().mockResolvedValue(new Set()),
	hasPending: vi.fn(() => false)
}));
vi.mock('$lib/stores/items.svelte', () => ({ loadItemsForList: vi.fn() }));

import AppLayout from './+layout.svelte';

afterEach(cleanup);

describe('App layout account menu presentation', () => {
	afterEach(() => {
		authState.user = { id: 'user-1', displayName: 'Test User', email: 'test@example.com', admin: false };
	});

	it('left aligns account actions and renders them at regular weight', async () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Page content</p>' }));
		render(AppLayout, { props: { children } });

		await fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
		expect(screen.getByRole('link', { name: 'Account' })).toHaveClass('font-normal');
		expect(screen.getByRole('button', { name: 'Log out' })).toHaveClass(
			'justify-start',
			'font-normal'
		);
	});

	it('shows admin menu item only for admins', async () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Page content</p>' }));
		render(AppLayout, { props: { children } });

		await fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
		expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();

		cleanup();
		authState.user = { ...authState.user, admin: true };
		render(AppLayout, { props: { children } });
		await fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
		const adminLink = screen.getByRole('link', { name: 'Admin' });
		expect(adminLink).toHaveAttribute('href', '/admin');
		expect(adminLink).toHaveClass('text-red-700', 'hover:bg-red-50');
	});
});
