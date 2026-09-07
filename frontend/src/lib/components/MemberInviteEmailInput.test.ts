import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MemberInviteEmailInput from './MemberInviteEmailInput.svelte';

afterEach(cleanup);

const suggestions = [
	{
		userId: 'casey-1',
		email: 'casey@example.com',
		displayName: 'Casey'
	},
	{
		userId: 'riley-1',
		email: 'riley@example.com',
		displayName: 'Riley'
	}
];

describe('MemberInviteEmailInput', () => {
	it('renders an email combobox with selectable member suggestions while typing', async () => {
		render(MemberInviteEmailInput, {
			props: {
				suggestions,
				label: 'Invite member',
				placeholder: 'Email address'
			}
		});

		const input = screen.getByRole('combobox', { name: 'Invite member' });
		expect(input).toHaveAttribute('type', 'email');
		expect(input).toHaveAttribute('placeholder', 'Email address');

		await fireEvent.input(input, { target: { value: 'case' } });

		expect(screen.getByRole('listbox', { name: 'Invite member' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /Casey/ })).toHaveTextContent('casey@example.com');
		expect(screen.queryByRole('option', { name: /Riley/ })).not.toBeInTheDocument();
	});

	it('keeps arbitrary typed email entry independent of suggestions', async () => {
		render(MemberInviteEmailInput, {
			props: {
				suggestions,
				label: 'Invite member',
				placeholder: 'Email address'
			}
		});

		const input = screen.getByRole('combobox', { name: 'Invite member' });
		await fireEvent.input(input, { target: { value: 'outside@example.com' } });

		expect(input).toHaveValue('outside@example.com');
	});

	it('fills the email value when a suggestion is selected', async () => {
		render(MemberInviteEmailInput, {
			props: {
				suggestions,
				label: 'Invite member',
				placeholder: 'Email address'
			}
		});

		const input = screen.getByRole('combobox', { name: 'Invite member' });
		await fireEvent.input(input, { target: { value: 'ril' } });
		await fireEvent.pointerDown(screen.getByRole('option', { name: /Riley/ }));
		await fireEvent.click(screen.getByRole('option', { name: /Riley/ }));

		expect(input).toHaveValue('riley@example.com');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('forwards focus, input, and blur handlers through the email input', async () => {
		const onfocus = vi.fn();
		const oninput = vi.fn();
		const onblur = vi.fn();
		render(MemberInviteEmailInput, {
			props: {
				suggestions,
				label: 'Invite member',
				onfocus,
				oninput,
				onblur
			}
		});

		const input = screen.getByRole('combobox', { name: 'Invite member' });
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'casey@example.com' } });
		await fireEvent.blur(input);

		expect(onfocus).toHaveBeenCalledOnce();
		expect(oninput).toHaveBeenCalledOnce();
		expect(onblur).toHaveBeenCalledOnce();
	});

	it('preserves email validation behavior from EmailInput', async () => {
		render(MemberInviteEmailInput, {
			props: {
				suggestions,
				label: 'Invite member',
				required: true
			}
		});

		const input = screen.getByRole('combobox', { name: 'Invite member' });
		await fireEvent.input(input, { target: { value: 'not-an-email' } });
		await fireEvent.blur(input);

		expect(screen.getByText('Email must include @')).toBeInTheDocument();
	});
});
