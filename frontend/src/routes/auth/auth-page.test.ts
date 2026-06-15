import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

// Mock the auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	setSession: vi.fn(),
	clearSession: vi.fn(),
	restoreSession: vi.fn().mockResolvedValue('unauthenticated'),
	isAuthenticated: vi.fn(() => false),
	getCurrentUser: vi.fn(() => null),
	getAccessToken: vi.fn(() => null),
}));

// Mock the auth API
vi.mock('$lib/api/auth', () => ({
	loginWithPasskey: vi.fn(),
	registerWithPasskey: vi.fn(),
	getAuthConfig: vi.fn().mockResolvedValue({ registrationEnabled: true }),
	ApiError: class ApiError extends Error {
		constructor(public status: number, message: string, public code?: string) {
			super(message);
		}
	},
}));

// Mock the health API — backend is healthy by default
vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn().mockResolvedValue(true),
}));

import { goto } from '$app/navigation';
import * as authApi from '$lib/api/auth';
import { checkHealth } from '$lib/api/health';
import { restoreSession, setSession } from '$lib/stores/auth.svelte';
import AuthPage from './+page.svelte';

async function waitForIdle() {
	await vi.advanceTimersByTimeAsync(0);
}

describe('AuthPage', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(checkHealth).mockResolvedValue(true);
		vi.mocked(restoreSession).mockResolvedValue('unauthenticated');
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
		vi.clearAllMocks();
	});

	it('renders Sign in with Passkey and Create account buttons', async () => {
		render(AuthPage);
		await waitForIdle();
		expect(screen.getByRole('button', { name: /sign in with passkey/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
	});

	it('uses primary styling for passkey sign-in and registration actions', async () => {
		render(AuthPage);
		await waitForIdle();

		const signInButton = screen.getByRole('button', { name: /sign in with passkey/i });
		expect(signInButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
		expect(signInButton).not.toHaveClass('bg-transparent');

		await fireEvent.click(screen.getByRole('button', { name: /create account/i }));

		const registerButton = screen.getByRole('button', { name: /register passkey/i });
		expect(registerButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
		expect(registerButton).not.toHaveClass('bg-transparent');
	});

	it('does not show registration form by default', async () => {
		render(AuthPage);
		await waitForIdle();
		expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
	});

	it('shows registration form when Create account is clicked', async () => {
		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /create account/i }));
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
	});

	it('navigates to /lists on successful sign-in', async () => {
		const mockResult = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		vi.mocked(authApi.loginWithPasskey).mockResolvedValue(mockResult);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(setSession).toHaveBeenCalledWith(mockResult);
			expect(goto).toHaveBeenCalledWith('/lists');
		});
	});

	it('shows origin-not-allowed message on SecurityError', async () => {
		const error = new DOMException('Origin not allowed', 'SecurityError');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/passkey origin not allowed/i)).toBeInTheDocument();
		});
	});

	it('shows registration-disabled message on 403 with REGISTRATION_DISABLED code', async () => {
		const ApiErrorClass = vi.mocked(authApi).ApiError as typeof authApi.ApiError;
		const error = new ApiErrorClass(403, 'Registration is disabled', 'REGISTRATION_DISABLED');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/registration is currently disabled/i)).toBeInTheDocument();
		});
	});

	it('shows origin-not-allowed message on 403 without known code', async () => {
		const ApiErrorClass = vi.mocked(authApi).ApiError as typeof authApi.ApiError;
		const error = new ApiErrorClass(403, 'Forbidden');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/passkey origin not allowed/i)).toBeInTheDocument();
		});
	});

	it('shows cancel message on NotAllowedError', async () => {
		const error = new DOMException('Cancelled', 'NotAllowedError');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await waitForIdle();
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
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
		});
	});

	it('shows passkey-not-registered message on 404 error', async () => {
		const ApiErrorClass = vi.mocked(authApi).ApiError as typeof authApi.ApiError;
		const error = new ApiErrorClass(404, 'This passkey is not registered. Please create an account first.');
		vi.mocked(authApi.loginWithPasskey).mockRejectedValue(error);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /sign in with passkey/i }));

		await waitFor(() => {
			expect(
				screen.getByText('This passkey is not registered. Please create an account first.'),
			).toBeInTheDocument();
		});
	});

	it('calls registerWithPasskey on form submit', async () => {
		const mockResult = { accessToken: 'tok', user: { id: '1', email: 'a@b.com', displayName: 'A' } };
		vi.mocked(authApi.registerWithPasskey).mockResolvedValue(mockResult);

		render(AuthPage);
		await waitForIdle();
		await fireEvent.click(screen.getByRole('button', { name: /create account/i }));

		await fireEvent.input(screen.getByLabelText(/display name/i), {
			target: { value: 'Alice' },
		});
		await fireEvent.input(screen.getByLabelText(/email/i), {
			target: { value: 'alice@example.com' },
		});

		await fireEvent.submit(screen.getByRole('button', { name: /register passkey/i }).closest('form')!);

		await waitFor(() => {
			expect(authApi.registerWithPasskey).toHaveBeenCalledWith('alice@example.com', 'Alice', undefined);
			expect(setSession).toHaveBeenCalledWith(mockResult);
			expect(goto).toHaveBeenCalledWith('/lists');
		});
	});

	it('redirects to /lists when backend startup later restores a valid session', async () => {
		vi.mocked(checkHealth).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
		vi.mocked(restoreSession).mockResolvedValueOnce('authenticated');

		render(AuthPage, { props: { data: { buildNumber: '0', restoreStatus: 'unavailable' } } });
		await waitForIdle();

		expect(screen.queryByRole('button', { name: /sign in with passkey/i })).not.toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(2000);

		await waitFor(() => {
			expect(restoreSession).toHaveBeenCalledTimes(1);
			expect(goto).toHaveBeenCalledWith('/lists');
		});
	});

	it('shows the auth controls when backend startup resolves to an unauthenticated session', async () => {
		vi.mocked(checkHealth).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
		vi.mocked(restoreSession).mockResolvedValueOnce('unauthenticated');

		render(AuthPage, { props: { data: { buildNumber: '0', restoreStatus: 'unavailable' } } });
		await waitForIdle();

		expect(screen.queryByRole('button', { name: /sign in with passkey/i })).not.toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(2000);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /sign in with passkey/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
		});
	});

	it('shows the startup timeout when health never becomes available', async () => {
		vi.mocked(checkHealth).mockResolvedValue(false);

		render(AuthPage, { props: { data: { buildNumber: '0', restoreStatus: 'unavailable' } } });
		await waitForIdle();

		await vi.advanceTimersByTimeAsync(120_000);

		expect(screen.getByText(/backend did not respond/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /sign in with passkey/i })).not.toBeInTheDocument();
		expect(restoreSession).not.toHaveBeenCalled();
	});
});
