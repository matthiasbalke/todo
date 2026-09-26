import { cleanup, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/version', () => ({ appVersion: '0.0.0' }));

import AdminLayout from './+layout.svelte';

afterEach(cleanup);

describe('admin layout', () => {
	it('renders section navigation and highlights the active settings section', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Settings content</p>' }));
		render(AdminLayout, {
			props: {
				data: { buildNumber: 'test-build', activeAdminPath: '/admin/settings' },
				children,
			},
		});

		expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
		expect(screen.getByText('Settings content')).toBeInTheDocument();
		const settingsLinks = screen.getAllByRole('link', { name: 'Settings' });
		const usersLinks = screen.getAllByRole('link', { name: 'Users' });

		expect(settingsLinks).toHaveLength(2);
		expect(usersLinks).toHaveLength(2);
		for (const link of settingsLinks) {
			expect(link).toHaveAttribute('href', '/admin/settings');
			expect(link).toHaveAttribute('aria-current', 'page');
			expect(link).toHaveClass('bg-primary-surface', 'text-primary-strong');
		}
		for (const link of usersLinks) {
			expect(link).toHaveAttribute('href', '/admin/users');
			expect(link).not.toHaveAttribute('aria-current');
		}
	});

	it('provides compact navigation and desktop sidebar navigation', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Users content</p>' }));
		render(AdminLayout, {
			props: {
				data: { buildNumber: 'test-build', activeAdminPath: '/admin/users' },
				children,
			},
		});

		const navs = screen.getAllByRole('navigation', { name: 'Admin sections' });
		expect(navs).toHaveLength(2);
		expect(navs[0]).toHaveClass('md:hidden');
		expect(navs[1].closest('aside')).toHaveClass('hidden', 'md:block');
		expect(within(navs[0]).getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page');
	});

	it('shows the app version in the admin footer', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Settings content</p>' }));
		render(AdminLayout, {
			props: {
				data: { buildNumber: '42', activeAdminPath: '/admin/settings' },
				children,
			},
		});

		expect(screen.getByText('v0.0.0.42')).toBeInTheDocument();
	});
});
