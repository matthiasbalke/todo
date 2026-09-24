import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
	updateAppSettings: vi.fn().mockImplementation((settings: { registrationEnabled: boolean; publicBaseUrl: string }) =>
		Promise.resolve(settings)
	),
	updateEmailSettings: vi.fn().mockResolvedValue(emailSettings),
	resetEmailSettings: vi.fn().mockResolvedValue(emailSettings),
	testEmailSettings: vi.fn().mockResolvedValue({ status: 'ACCEPTED', category: null, message: null, detail: null, hint: null }),
	updateAdminUser: vi.fn(),
	updateUserAdmin: vi.fn(),
	updateUserBlocked: vi.fn(),
	createRecoveryLink: vi.fn().mockResolvedValue({
		tokenId: 'token-1',
		url: 'https://todo.example/recover/secret',
		expiresAt: '2026-06-23T12:00:00Z',
	}),
}));

import { createRecoveryLink, testEmailSettings, updateAppSettings, updateEmailSettings, updateUserBlocked } from '$lib/api/admin';
import { ApiError } from '$lib/api/client';
import SettingsPage from './settings/+page.svelte';
import UsersPage from './users/+page.svelte';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const data = {
	buildNumber: 'test-build',
	activeAdminPath: '/admin/settings',
	settings: { app: appSettings, email: emailSettings },
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
		render(UsersPage, { props: { data } });

		expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
		expect(screen.queryByLabelText('Registration enabled')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Public app URL')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Email delivery enabled')).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /create recovery link/i }));

		expect(createRecoveryLink).toHaveBeenCalledWith('user-1');
		expect(await screen.findByText('https://todo.example/recover/secret')).toBeInTheDocument();
	});

	it('shows the backend message when an admin tries to block itself', async () => {
		vi.mocked(updateUserBlocked).mockRejectedValue(new ApiError(409, 'You cannot block yourself.', 'SELF_BLOCKED'));

		render(UsersPage, {
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

	it('saves email settings as a draft and sends a test email after save', async () => {
		render(SettingsPage, { props: { data } });

		expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
		expect(screen.queryByLabelText('Protocol')).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /create recovery link/i })).not.toBeInTheDocument();
		await fireEvent.click(screen.getByLabelText('Email delivery enabled'));
		await fireEvent.input(screen.getByLabelText('SMTP host'), { target: { value: 'smtp.example.com' } });
		await fireEvent.input(screen.getByLabelText('SMTP port'), { target: { value: '587' } });
		await fireEvent.input(screen.getByLabelText('Sender email'), { target: { value: 'todo@example.com' } });
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /save email settings/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

		expect(updateEmailSettings).toHaveBeenCalledWith(expect.objectContaining({
			enabled: true,
			host: 'smtp.example.com',
			port: 587,
			protocol: 'smtp',
		}));

		expect(screen.getByText('Test email settings')).toBeInTheDocument();
		expect(screen.getByText('Send a test email below to verify the active email configuration.')).toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText('Test recipient'), { target: { value: 'recipient@example.com' } });
		expect(screen.queryByRole('button', { name: /test email settings/i })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Test' })).toHaveClass('py-2');
		await fireEvent.click(screen.getByRole('button', { name: 'Test' }));

		expect(testEmailSettings).toHaveBeenCalledWith('recipient@example.com');
	});

	it('shows safe test email diagnostic details and hints', async () => {
		vi.mocked(testEmailSettings).mockResolvedValueOnce({
			status: 'FAILED',
			category: 'SERVER_UNREACHABLE',
			message: 'Email server is not reachable',
			detail: 'Could not connect to smtp.example.com:587 within the SMTP timeout.',
			hint: 'Check the SMTP host, port, firewall, and whether the provider expects STARTTLS or SSL/TLS.',
		});
		render(SettingsPage, { props: { data } });

		await fireEvent.input(screen.getByLabelText('Test recipient'), { target: { value: 'recipient@example.com' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Test' }));

		expect(await screen.findByText('Email server is not reachable')).toBeInTheDocument();
		expect(screen.getByText('Could not connect to smtp.example.com:587 within the SMTP timeout.')).toBeInTheDocument();
		expect(screen.getByText('Check the SMTP host, port, firewall, and whether the provider expects STARTTLS or SSL/TLS.')).toBeInTheDocument();
	});

	it('replaces configured SMTP password when the password field is edited', async () => {
		render(SettingsPage, {
			props: {
				data: {
					...data,
					settings: {
						...data.settings,
						email: {
							...emailSettings,
							enabled: true,
							authEnabled: true,
							host: 'smtp.example.com',
							port: 587,
							username: 'mailer',
							passwordConfigured: true,
							from: 'todo@example.com',
						},
					},
				},
			},
		});

		expect(screen.queryByLabelText('Password action')).not.toBeInTheDocument();
		expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText('Password'), { target: { value: '' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		await waitFor(() => {
			expect(screen.getAllByText('SMTP password is required when authentication is enabled.').length).toBeGreaterThan(0);
		});
		expect(screen.queryByText('SMTP password cannot be cleared while authentication is enabled.')).not.toBeInTheDocument();

		await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'new-secret' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

		expect(updateEmailSettings).toHaveBeenCalledWith(expect.objectContaining({
			passwordAction: 'REPLACE',
			password: 'new-secret',
		}));
	});

	it('autosaves public app URL without saving SMTP settings', async () => {
		vi.useFakeTimers();
		try {
			render(SettingsPage, { props: { data } });

			await fireEvent.input(screen.getByLabelText('Public app URL'), { target: { value: 'https://todo.example.com' } });
			await vi.advanceTimersByTimeAsync(700);

			await waitFor(() => {
				expect(updateAppSettings).toHaveBeenCalledWith({
					registrationEnabled: true,
					publicBaseUrl: 'https://todo.example.com',
				});
			});
			expect(updateEmailSettings).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});
});
