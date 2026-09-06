import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const owner = {
	userId: 'owner-1',
	email: 'owner@example.com',
	displayName: 'Owner',
	role: 'OWNER' as const,
	createdAt: '2026-01-01'
};
const editor = {
	userId: 'editor-1',
	email: 'editor@example.com',
	displayName: 'Editor',
	role: 'EDITOR' as const,
	createdAt: '2026-01-02'
};

vi.mock('$lib/stores/auth.svelte', () => ({
	getCurrentUser: vi.fn(() => ({
		id: 'owner-1',
		email: 'owner@example.com',
		displayName: 'Owner'
	}))
}));

vi.mock('$lib/api/lists', () => ({
	getMembers: vi.fn(),
	getMemberSuggestions: vi.fn(),
	addMember: vi.fn(),
	changeMemberRole: vi.fn(),
	removeMember: vi.fn()
}));

import * as listsApi from '$lib/api/lists';
import { ApiError } from '$lib/api/client';
import MembersDialog from './MembersDialog.svelte';

describe('MembersDialog Select positioning', () => {
	beforeEach(() => {
		vi.mocked(listsApi.getMembers).mockResolvedValue([owner, editor]);
		vi.mocked(listsApi.getMemberSuggestions).mockResolvedValue([
			{
				userId: 'viewer-1',
				email: 'viewer@example.com',
				displayName: 'Viewer'
			},
			{
				userId: 'editor-1',
				email: 'editor@example.com',
				displayName: 'Editor'
			}
		]);
		vi.mocked(listsApi.changeMemberRole).mockImplementation(async (_listId, userId, { role }) => ({
			...(userId === owner.userId ? owner : editor),
			role
		}));
		vi.mocked(listsApi.addMember).mockResolvedValue({
			userId: 'viewer-1',
			email: 'viewer@example.com',
			displayName: 'Viewer',
			role: 'VIEWER',
			createdAt: '2026-01-03'
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	async function renderOwnerDialog() {
		render(MembersDialog, {
			props: { listId: 'list-1', canManageMembers: true, onclose: vi.fn() }
		});
		await screen.findByText('Editor');
		return screen.getAllByRole('combobox', { name: 'Select an option' });
	}

	it('anchors each role listbox to its corresponding trigger inside the transformed dialog', async () => {
		const triggers = await renderOwnerDialog();
		expect(triggers).toHaveLength(2);
		expect(triggers[0]).toHaveAttribute('size', '6');

		for (const trigger of triggers) {
			await fireEvent.click(trigger);
			const listboxId = trigger.getAttribute('aria-controls');
			const listbox = document.getElementById(listboxId!);

			expect(listbox).not.toBeNull();
			expect(listbox!.parentElement).toBe(trigger.parentElement?.parentElement);
			expect(listbox).toHaveClass('absolute', 'left-0', 'top-full', 'w-full');
			expect(listbox).not.toHaveClass('fixed');

			await fireEvent.click(trigger);
		}
	});

	it('shows membership without mutation controls when management is unavailable', async () => {
		render(MembersDialog, {
			props: { listId: 'list-1', canManageMembers: false, onclose: vi.fn() }
		});

		await screen.findByText('editor@example.com');
		expect(screen.getAllByText('Owner')).toHaveLength(2);
		expect(screen.getAllByText('Editor')).toHaveLength(2);
		expect(screen.queryByPlaceholderText('Email address')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
		expect(listsApi.getMemberSuggestions).not.toHaveBeenCalled();
	});

	it('preserves existing-member role changes', async () => {
		const [memberRole] = await renderOwnerDialog();
		await fireEvent.click(memberRole);
		await fireEvent.click(screen.getByRole('option', { name: 'Viewer' }));

		await waitFor(() => {
			expect(listsApi.changeMemberRole).toHaveBeenCalledWith('list-1', 'editor-1', {
				role: 'VIEWER'
			});
		});
	});

	it('preserves invitation role selection', async () => {
		const [, invitationRole] = await renderOwnerDialog();
		await fireEvent.click(invitationRole);
		await fireEvent.click(screen.getByRole('option', { name: 'Viewer' }));
		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'viewer@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => {
			expect(listsApi.addMember).toHaveBeenCalledWith('list-1', {
				email: 'viewer@example.com',
				role: 'VIEWER'
			});
		});
	});

	it('loads suggestions and invites a suggested member by email', async () => {
		await renderOwnerDialog();

		expect(listsApi.getMemberSuggestions).toHaveBeenCalledWith('list-1');
		const renderedSuggestions = Array.from(document.querySelectorAll('datalist option'));
		expect(renderedSuggestions).toHaveLength(1);
		expect(renderedSuggestions[0]).toHaveAttribute('value', 'viewer@example.com');
		expect(renderedSuggestions[0]).toHaveAttribute('label', 'Viewer (viewer@example.com)');

		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'viewer@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => {
			expect(listsApi.addMember).toHaveBeenCalledWith('list-1', {
				email: 'viewer@example.com',
				role: 'EDITOR'
			});
		});
	});

	it('excludes loaded members from suggestions by trimmed case-insensitive email identity', async () => {
		vi.mocked(listsApi.getMembers).mockResolvedValueOnce([
			owner,
			{
				...editor,
				email: ' Editor@Example.com '
			}
		]);
		vi.mocked(listsApi.getMemberSuggestions).mockResolvedValueOnce([
			{
				userId: 'viewer-1',
				email: 'viewer@example.com',
				displayName: 'Viewer'
			},
			{
				userId: 'editor-1',
				email: 'editor@example.com',
				displayName: 'Editor'
			}
		]);

		await renderOwnerDialog();

		const renderedSuggestions = Array.from(document.querySelectorAll('datalist option'));
		expect(renderedSuggestions).toHaveLength(1);
		expect(renderedSuggestions[0]).toHaveAttribute('value', 'viewer@example.com');
	});

	it('keeps member management available when suggestions fail to load', async () => {
		vi.mocked(listsApi.getMemberSuggestions).mockRejectedValueOnce(
			new ApiError(500, 'Suggestions failed')
		);
		await renderOwnerDialog();

		expect(screen.getByText('editor@example.com')).toBeInTheDocument();
		expect(
			screen.getByText('Suggestions unavailable. Something went wrong — please try again.')
		).toBeInTheDocument();
		expect(document.querySelectorAll('datalist option')).toHaveLength(0);

		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'outside@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => {
			expect(listsApi.addMember).toHaveBeenCalledWith('list-1', {
				email: 'outside@example.com',
				role: 'EDITOR'
			});
		});
	});

	it('preserves typed unsuggested invite emails', async () => {
		await renderOwnerDialog();

		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'outside@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		await waitFor(() => {
			expect(listsApi.addMember).toHaveBeenCalledWith('list-1', {
				email: 'outside@example.com',
				role: 'EDITOR'
			});
		});
	});

	it('shows a non-enumerating invite failure for missing accounts', async () => {
		vi.mocked(listsApi.addMember).mockRejectedValueOnce(new ApiError(404, 'Could not add member'));
		await renderOwnerDialog();

		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'missing@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(await screen.findByText("We couldn't add that member. Check the email address and try again.")).toBeInTheDocument();
	});

	it('shows retry guidance for rate-limited invites', async () => {
		vi.mocked(listsApi.addMember).mockRejectedValueOnce(new ApiError(429, 'Too many requests'));
		await renderOwnerDialog();

		await fireEvent.input(screen.getByPlaceholderText('Email address'), {
			target: { value: 'later@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(await screen.findByText('Too many invite attempts. Please wait before trying again.')).toBeInTheDocument();
	});
});
