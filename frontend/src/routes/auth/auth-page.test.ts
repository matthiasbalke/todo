import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

// Mock the auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	setSession: vi.fn(),
	clearSession: vi.fn(),
	restoreSession: vi.fn(),
	isAuthenticated: vi.fn(() => false),
	getCurrentUser: vi.fn(() => null),
	getAccessToken: vi.fn(() => null),
}));

// Mock the auth API
vi.mock('$lib/api/auth', () => ({
	loginWithPasskey: vi.fn(),
	registerWithPasskey: vi.fn(),
	ApiError: class ApiError extends Error {
		constructor(public status: number, message: string) {
			super(message);
		}
	},
}));

import { goto } from '$app/navigation';
import * as authApi from '$lib/api/auth';
import { setSession } from '$lib/stores/auth.svelte';
import AuthPage from './+page.svelte';

describe('AuthPage', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('renders Sign in with Passkey and Create account buttons', () => {
		render(AuthPage);
		expect(screen.getByRole('button', { name: /sign in with passkey/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
	});

	it('does not show registration form by default', () => {
		render(AuthPage);
		expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
	});

	it('shows registration form when Create account is clicked', async () => {
		render(AuthPage);
		await fireEvent.click(screen.getByRole('button', { name: /create account/i }));
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
	});

	it('navigates to /lists on successful sign-in', async () => {
		const mockResult = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		vi.mocked(authApi.loginWithPasskey).mockResolvedValue(mockResult);

		render(AuthPage);
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(setSession).toHaveBeenCalledWith(mockResult);
			expect(goto).toHaveBeenCalledWith('/lists');
		});
	});

	it('shows cancel message on NotAllowedError', async () => {
		const error = new DOMException('Cancelled', 'NotAllowedError');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
		});
	});

	it('shows rate-limit message on 429 error', async () => {
		const ApiErrorClass = vi.mocked(authApi).ApiError as typeof authApi.ApiError;
		const error = new ApiErrorClass(429, 'Too Many Requests');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
		});
	});

	it('calls registerWithPasskey on form submit', async () => {
		const mockResult = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		vi.mocked(authApi.registerWithPasskey).mockResolvedValue(mockResult);

		render(AuthPage);
		await fireEvent.click(screen.getByRole('button', { name: /create account/i }));

		await fireEvent.input(screen.getByLabelText(/display name/i), {
			target: { value: 'Alice' },
		});
		await fireEvent.input(screen.getByLabelText(/email/i), {
			target: { value: 'alice@example.com' },
		});

		await fireEvent.submit(screen.getByRole('button', { name: /register passkey/i }).closest('form')!);

		await waitFor(() => {
			expect(authApi.registerWithPasskey).toHaveBeenCalledWith('alice@example.com', 'Alice');
			expect(setSession).toHaveBeenCalledWith(mockResult);
			expect(goto).toHaveBeenCalledWith('/lists');
		});
	});
});
