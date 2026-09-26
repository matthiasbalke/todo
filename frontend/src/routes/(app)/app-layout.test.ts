import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
const appState = vi.hoisted(() => ({
	pathname: '/lists',
}));
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return new URL(`https://todo.example${appState.pathname}`);
		},
	},
}));
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
		appState.pathname = '/lists';
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
		expect(adminLink).toHaveClass('text-danger-strong', 'hover:bg-danger-surface');
	});

	it('widens only admin main content and keeps the header width stable', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Admin content</p>' }));
		appState.pathname = '/admin/settings';

		const { container } = render(AppLayout, { props: { children } });

		const headerInner = container.querySelector('header > div');
		const topChrome = container.querySelector('header')?.parentElement;
		const main = container.querySelector('main');
		expect(topChrome).toHaveClass('fixed', 'top-0');
		expect(headerInner).toHaveClass('max-w-2xl');
		expect(headerInner).not.toHaveClass('max-w-5xl');
		expect(main).toHaveClass('max-w-5xl', 'overflow-y-auto', 'fixed', 'app-scrollbar-hidden');
		expect(main).not.toHaveClass('max-w-2xl');
	});

	it('keeps normal app route main content at the narrow width', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>List content</p>' }));

		const { container } = render(AppLayout, { props: { children } });

		const main = container.querySelector('main');
		expect(container.firstElementChild).toHaveClass('fixed', 'inset-0', 'overflow-hidden');
		expect(main).toHaveClass('max-w-2xl', 'overflow-y-auto', 'fixed', 'app-scrollbar-hidden');
		expect(main).toHaveAttribute('data-testid', 'app-scroll-container');
		expect(main?.getAttribute('style')).toContain('top: var(--app-top-chrome-height, 0px)');
		expect(main?.getAttribute('style')).toContain('bottom: 0');
		expect(main?.getAttribute('style')).toContain('padding-bottom: calc(var(--fixed-action-footer-height, 0px) + 1.5rem)');
		expect(main).not.toHaveClass('max-w-5xl');
	});

	it('forwards header wheel scrolling to the app content pane', async () => {
		const children = createRawSnippet(() => ({ render: () => '<p>List content</p>' }));

		const { container } = render(AppLayout, { props: { children } });

		const topChrome = container.querySelector('header')?.parentElement;
		const main = screen.getByTestId('app-scroll-container');
		Object.defineProperty(main, 'clientHeight', { configurable: true, value: 500 });
		Object.defineProperty(main, 'scrollHeight', { configurable: true, value: 1500 });

		topChrome?.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 }));

		expect(main.scrollTop).toBe(120);
	});
});
