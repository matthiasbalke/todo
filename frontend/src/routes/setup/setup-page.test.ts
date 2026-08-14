import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/api/setup', () => ({
	setupAdminWithPasskey: vi.fn().mockResolvedValue({
		accessToken: 'token',
		user: { id: 'admin-1', email: 'admin@example.com', displayName: 'Admin', admin: true },
	}),
}));
vi.mock('$lib/stores/auth.svelte', () => ({ setSession: vi.fn() }));

import { goto } from '$app/navigation';
import { setupAdminWithPasskey } from '$lib/api/setup';
import { setSession } from '$lib/stores/auth.svelte';
import SetupPage from './+page.svelte';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('setup page', () => {
	it('creates the first admin and routes to admin area', async () => {
		render(SetupPage);

		await fireEvent.input(screen.getByLabelText(/display name/i), { target: { value: 'Admin' } });
		await fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
		await fireEvent.input(screen.getByLabelText(/setup secret/i), { target: { value: 'setup-secret' } });
		await fireEvent.click(screen.getByRole('button', { name: /create admin passkey/i }));

		expect(setupAdminWithPasskey).toHaveBeenCalledWith('admin@example.com', 'Admin', 'setup-secret', undefined);
		expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'token' }));
		expect(goto).toHaveBeenCalledWith('/admin');
	});

	it('shows setup secret validation errors from the backend', async () => {
		vi.mocked(setupAdminWithPasskey).mockRejectedValueOnce(
			new ApiError(403, 'Setup secret is invalid. Check the backend logs and try again.', 'SETUP_SECRET_INVALID'),
		);
		render(SetupPage);

		await fireEvent.input(screen.getByLabelText(/display name/i), { target: { value: 'Admin' } });
		await fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
		await fireEvent.input(screen.getByLabelText(/setup secret/i), { target: { value: 'wrong' } });
		await fireEvent.click(screen.getByRole('button', { name: /create admin passkey/i }));

		expect(await screen.findByText('Setup secret is invalid. Check the backend logs and try again.')).toBeInTheDocument();
		expect(setSession).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});
});
