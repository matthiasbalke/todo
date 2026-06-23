import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/admin', () => ({
	setRegistrationEnabled: vi.fn().mockResolvedValue({ registrationEnabled: false }),
	updateAdminUser: vi.fn(),
	updateUserAdmin: vi.fn(),
	updateUserBlocked: vi.fn(),
	createRecoveryLink: vi.fn().mockResolvedValue({
		tokenId: 'token-1',
		url: 'https://todo.example/recover/secret',
		expiresAt: '2026-06-23T12:00:00Z',
	}),
}));

import { createRecoveryLink, updateUserBlocked } from '$lib/api/admin';
import { ApiError } from '$lib/api/client';
import AdminPage from './+page.svelte';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const data = {
	buildNumber: 'test-build',
	settings: { registrationEnabled: true },
	stats: { users: 2, admins: 1, blockedUsers: 0, lists: 3, todoItems: 8 },
	users: [
		{
			id: 'user-1',
			email: 'user@example.com',
			displayName: 'User',
			admin: false,
			blocked: false,
			blockedAt: null,
			passkeyCount: 1,
			createdAt: '2026-06-23T10:00:00Z',
		},
	],
};

describe('admin page', () => {
	it('shows stats and displays a generated recovery link', async () => {
		render(AdminPage, { props: { data } });

		expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /create recovery link/i }));

		expect(createRecoveryLink).toHaveBeenCalledWith('user-1');
		expect(await screen.findByText('https://todo.example/recover/secret')).toBeInTheDocument();
	});

	it('shows the backend message when an admin tries to block itself', async () => {
		vi.mocked(updateUserBlocked).mockRejectedValue(new ApiError(409, 'You cannot block yourself.', 'SELF_BLOCKED'));

		render(AdminPage, {
			props: {
				data: {
					...data,
					users: [
						{
							...data.users[0],
							id: 'admin-1',
							email: 'admin@example.com',
							admin: true,
						},
					],
				},
			},
		});

		await fireEvent.click(screen.getByLabelText('Blocked admin@example.com'));

		expect(updateUserBlocked).toHaveBeenCalledWith('admin-1', true);
		expect(await screen.findByText('You cannot block yourself.')).toBeInTheDocument();
	});
});
