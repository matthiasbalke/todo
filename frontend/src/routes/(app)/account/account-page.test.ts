import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/push.svelte', () => ({
	getPushState: vi.fn(() => 'prompt'),
	initPushState: vi.fn(),
	requestPushSubscription: vi.fn(),
	revokePushSubscription: vi.fn(),
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => null),
	updateCurrentUser: vi.fn(),
	clearSession: vi.fn(),
}));

vi.mock('$lib/api/users', () => ({
	updateMe: vi.fn(),
	updatePreferences: vi.fn(),
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

vi.mock('$lib/stores/preferences.svelte', () => ({
	setProfile: vi.fn(),
}));

vi.mock('$lib/stores/today.svelte', () => ({
	refreshToday: vi.fn().mockResolvedValue(undefined),
}));

import AccountPage from './+page.svelte';
import { updateMe, updatePreferences } from '$lib/api/users';
import { refreshToday } from '$lib/stores/today.svelte';

const mockProfile = {
	id: 'user-1',
	displayName: 'Test User',
	email: 'test@example.com',
	timeZone: 'UTC',
	timeZoneInitialized: true,
	todayViewEnabled: true,
};

const mockData = {
	profile: mockProfile,
	passkeys: [],
	buildNumber: '0',
};

describe('AccountPage notifications section', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('renders the Notifications section heading', () => {
		render(AccountPage, { props: { data: mockData } });
		expect(screen.getByText('Notifications')).toBeInTheDocument();
	});

	it('shows Enable notifications button when push state is prompt', () => {
		render(AccountPage, { props: { data: mockData } });
		expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument();
	});
});

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

	it('uses danger styling for the account deletion action', () => {
		render(AccountPage, { props: { data: mockData } });

		const deleteButton = screen.getByRole('button', { name: 'Delete my account' });
		expect(deleteButton).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
		expect(deleteButton).not.toHaveClass('bg-transparent');
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

describe('AccountPage settings', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('keeps the Account heading and presents the account settings', () => {
		render(AccountPage, { props: { data: mockData } });

		expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
		expect(
			screen.queryByText(/timezone determines which calendar date is considered today/i)
		).not.toBeInTheDocument();
		expect(screen.getByText('Show Today View')).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: 'Show Today View' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(screen.queryByText(/Today view: Enabled|Today view: Disabled/)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Save Today preferences' })).not.toBeInTheDocument();
	});

	it('saves a Today View change immediately and refreshes Today on success', async () => {
		vi.mocked(updatePreferences).mockResolvedValueOnce({
			...mockProfile,
			todayViewEnabled: false,
		});
		render(AccountPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('switch', { name: 'Show Today View' }));

		expect(updatePreferences).toHaveBeenCalledWith({
			timeZone: 'UTC',
			todayViewEnabled: false,
		});
		expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
		expect(refreshToday).toHaveBeenCalledOnce();
		expect(screen.getByRole('switch', { name: 'Show Today View' })).toHaveAttribute(
			'aria-checked',
			'false'
		);
	});

	it('saves timezone changes immediately with both current values', async () => {
		vi.mocked(updatePreferences).mockResolvedValueOnce({
			...mockProfile,
			timeZone: 'Europe/Berlin',
		});
		render(AccountPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('combobox', { name: 'Timezone' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Berlin (Europe)' }));

		expect(updatePreferences).toHaveBeenCalledWith({
			timeZone: 'Europe/Berlin',
			todayViewEnabled: true,
		});
		expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
	});

	it('disables both controls and clears prior feedback while a new save is pending', async () => {
		vi.mocked(updatePreferences).mockResolvedValueOnce({
			...mockProfile,
			todayViewEnabled: false,
		});
		render(AccountPage, { props: { data: mockData } });
		const toggle = screen.getByRole('switch', { name: 'Show Today View' });

		await fireEvent.click(toggle);
		expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();

		let resolveSave!: (value: typeof mockProfile) => void;
		vi.mocked(updatePreferences).mockImplementationOnce(
			() => new Promise((resolve) => { resolveSave = resolve; })
		);
		await fireEvent.click(toggle);

		expect(screen.queryByText('Preferences saved.')).not.toBeInTheDocument();
		expect(toggle).toBeDisabled();
		expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeDisabled();

		resolveSave(mockProfile);
		expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
	});

	it('rolls both controls back to the last persisted values after failure', async () => {
		vi.mocked(updatePreferences).mockRejectedValueOnce(new Error('Save failed'));
		render(AccountPage, { props: { data: mockData } });

		await fireEvent.click(screen.getByRole('switch', { name: 'Show Today View' }));

		expect(await screen.findByText('Error: Save failed')).toBeInTheDocument();
		expect(screen.queryByText('Preferences saved.')).not.toBeInTheDocument();
		expect(screen.getByRole('switch', { name: 'Show Today View' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveValue('UTC');
	});
});
