import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import EmailInput from './EmailInput.svelte';

describe('EmailInput', () => {
	it('binds values and forwards IDs, classes, attributes, and events', async () => {
		const onfocus = vi.fn();
		const { container } = render(EmailInput, {
			props: {
				id: 'invite-email',
				class: 'invite-class',
				autocomplete: 'email',
				onfocus
			}
		});
		const input = container.querySelector('input') as HTMLInputElement;

		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'person@example.com' } });
		expect(input).toHaveValue('person@example.com');
		expect(input).toHaveAttribute('id', 'invite-email');
		expect(input).toHaveAttribute('autocomplete', 'email');
		expect(input).toHaveClass('invite-class');
		expect(onfocus).toHaveBeenCalledOnce();
	});

	it('preserves required and custom email validation', async () => {
		const customValidate = vi.fn(() => 'Already invited');
		const { container } = render(EmailInput, { props: { customValidate } });
		const input = container.querySelector('input') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'person@example.com' } });
		expect(customValidate).toHaveBeenCalledWith('person@example.com');
		expect(container.querySelector('[id$="-error"]')).toHaveTextContent('Already invited');
	});
});
