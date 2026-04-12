import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => null),
	updateCurrentUser: vi.fn(),
	clearSession: vi.fn(),
}));

vi.mock('$lib/api/users', () => ({
	updateMe: vi.fn(),
	getPasskeys: vi.fn().mockResolvedValue([]),
	getAddPasskeyOptions: vi.fn(),
	submitAddPasskey: vi.fn(),
	deletePasskey: vi.fn(),
	getDeletionPreview: vi.fn(),
	deleteAccount: vi.fn(),
}));

vi.mock('$lib/api/errors', () => ({
	friendlyError: vi.fn((e: unknown) => String(e)),
}));

vi.mock('@simplewebauthn/browser', () => ({
	startRegistration: vi.fn(),
	WebAuthnError: class WebAuthnError extends Error {
		code: string;
		constructor(message: string, code: string) {
			super(message);
			this.code = code;
		}
	},
}));

vi.mock('$lib/api/client', () => ({
	ApiError: class ApiError extends Error {
		code: string;
		constructor(message: string, code: string) {
			super(message);
			this.code = code;
		}
	},
}));

import AccountPage from './+page.svelte';
import { updateMe } from '$lib/api/users';

const mockProfile = {
	id: 'user-1',
	displayName: 'Test User',
	email: 'test@example.com',
};

const mockData = {
	profile: mockProfile,
	passkeys: [],
	buildNumber: '0',
};

describe('AccountPage email inline-edit', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('renders email as text, not an input, by default', () => {
		render(AccountPage, { props: { data: mockData } });
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();
	});

	it('clicking the email text shows the input and Save button', async () => {
		render(AccountPage, { props: { data: mockData } });
		await fireEvent.click(screen.getByRole('button', { name: /test@example\.com/i }));
		expect(screen.getByRole('textbox')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
	});

	it('blur on input exits edit mode without saving', async () => {
		render(AccountPage, { props: { data: mockData } });
		await fireEvent.click(screen.getByRole('button', { name: /test@example\.com/i }));
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'new@example.com' } });
		await fireEvent.focusOut(input.parentElement!, { relatedTarget: null });
		expect(updateMe).not.toHaveBeenCalled();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	it('should not dismiss email editor when mousedown on Save button is followed by focusout with null relatedTarget', async () => {
		render(AccountPage, { props: { data: mockData } });
		await fireEvent.click(screen.getByRole('button', { name: /test@example\.com/i }));
		const input = screen.getByRole('textbox');
		const editorDiv = input.parentElement!;

		// Simulate Safari: clicking Save button triggers mousedown on the div but button gets no focus
		await fireEvent.mouseDown(editorDiv);
		await fireEvent.focusOut(input, { relatedTarget: null });

		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});
});
