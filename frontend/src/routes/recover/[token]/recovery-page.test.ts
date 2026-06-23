import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/recovery', () => ({
	recoverWithPasskey: vi.fn().mockResolvedValue({ success: true }),
}));

import { recoverWithPasskey } from '$lib/api/recovery';
import { ApiError } from '$lib/api/client';
import RecoveryPage from './+page.svelte';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('recovery page', () => {
	it('registers a passkey and shows a login link without setting a session', async () => {
		render(RecoveryPage, {
			props: {
				data: {
					buildNumber: 'test-build',
					token: 'secret',
					recovery: {
						email: 'user@example.com',
						displayName: 'User',
						expiresAt: '2026-06-23T12:00:00Z',
					},
				},
			},
		});

		await fireEvent.click(screen.getByRole('button', { name: /register new passkey/i }));

		expect(recoverWithPasskey).toHaveBeenCalledWith('secret', undefined);
		expect(await screen.findByText(/passkey registered/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/auth');
	});

	it('shows a blocked account message when recovery is rejected after the page loads', async () => {
		vi.mocked(recoverWithPasskey).mockRejectedValue(new ApiError(409, 'Account is blocked'));

		render(RecoveryPage, {
			props: {
				data: {
					buildNumber: 'test-build',
					token: 'secret',
					recovery: {
						email: 'user@example.com',
						displayName: 'User',
						expiresAt: '2026-06-23T12:00:00Z',
					},
				},
			},
		});

		await fireEvent.click(screen.getByRole('button', { name: /register new passkey/i }));

		expect(await screen.findByText('This account is blocked. Please contact the admin.')).toBeInTheDocument();
		expect(screen.queryByText(/passkey registered/i)).not.toBeInTheDocument();
	});
});
