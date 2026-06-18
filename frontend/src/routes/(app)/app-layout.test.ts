import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/api/auth', () => ({ logout: vi.fn() }));
vi.mock('$lib/stores/auth.svelte', () => ({
	clearSession: vi.fn(),
	getAccessToken: vi.fn(() => null),
	getCurrentUser: vi.fn(() => ({ id: 'user-1', displayName: 'Test User', email: 'test@example.com' })),
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
});
