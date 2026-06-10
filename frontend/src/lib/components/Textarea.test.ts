import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Textarea from './Textarea.svelte';

afterEach(cleanup);

describe('Textarea', () => {
	it('renders an initial value and updates multiline input', async () => {
		render(Textarea, { props: { value: 'First line', ariaLabel: 'Notes' } });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		expect(textarea).toHaveValue('First line');
		await fireEvent.input(textarea, { target: { value: 'First line\nSecond line' } });

		expect(textarea).toHaveValue('First line\nSecond line');
	});

	it('uses default rows and vertical resize behavior', () => {
		render(Textarea, { props: { ariaLabel: 'Notes' } });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		expect(textarea).toHaveAttribute('rows', '3');
		expect(textarea).toHaveClass('resize-y');
	});

	it.each([
		['none', 'resize-none'],
		['vertical', 'resize-y'],
		['horizontal', 'resize-x'],
		['both', 'resize']
	] as const)('supports %s resizing', (resize, expectedClass) => {
		render(Textarea, { props: { ariaLabel: 'Notes', rows: 6, resize } });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		expect(textarea).toHaveAttribute('rows', '6');
		expect(textarea).toHaveClass(expectedClass);
	});

	it('supports placeholder, required, disabled, native attributes, and consumer classes', () => {
		render(Textarea, {
			props: {
				label: 'Details',
				placeholder: 'Enter details',
				required: true,
				disabled: true,
				name: 'details',
				maxlength: 120,
				autocomplete: 'off',
				'data-testid': 'details',
				class: 'min-h-40'
			}
		});
		const textarea = screen.getByTestId('details');

		expect(textarea).toHaveAttribute('placeholder', 'Enter details');
		expect(textarea).toBeRequired();
		expect(textarea).toBeDisabled();
		expect(textarea).toHaveAttribute('name', 'details');
		expect(textarea).toHaveAttribute('maxlength', '120');
		expect(textarea).toHaveAttribute('autocomplete', 'off');
		expect(textarea).toHaveClass('w-full', 'min-h-40');
		expect(screen.getByText('Details').parentElement).toHaveTextContent('*');
	});

	it('forwards native input, focus, and blur handlers', async () => {
		const oninput = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		render(Textarea, {
			props: { ariaLabel: 'Notes', oninput, onfocus, onblur }
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		await fireEvent.focus(textarea);
		await fireEvent.input(textarea, { target: { value: 'Updated' } });
		await fireEvent.blur(textarea);

		expect(onfocus).toHaveBeenCalledOnce();
		expect(oninput).toHaveBeenCalledOnce();
		expect(onblur).toHaveBeenCalledOnce();
		expect(oninput.mock.calls[0][0]).toBeInstanceOf(Event);
	});

	it('associates a visible label and description with the textarea', () => {
		render(Textarea, {
			props: { label: 'Notes', description: 'Include relevant context.' }
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		const label = screen.getByText('Notes');
		const description = screen.getByText('Include relevant context.');

		expect(label).toHaveAttribute('for', textarea.id);
		expect(textarea).toHaveAttribute('aria-describedby', description.id);
	});

	it('supports a screen-reader label without visible label text', () => {
		render(Textarea, { props: { ariaLabel: 'Private notes' } });

		expect(screen.getByRole('textbox', { name: 'Private notes' })).toBeInTheDocument();
		expect(screen.queryByText('Private notes')).not.toBeInTheDocument();
	});

	it('creates unique IDs for multiple instances', () => {
		render(Textarea, { props: { label: 'First notes', description: 'First description' } });
		render(Textarea, { props: { label: 'Second notes', description: 'Second description' } });

		const first = screen.getByRole('textbox', { name: 'First notes' });
		const second = screen.getByRole('textbox', { name: 'Second notes' });
		expect(first.id).not.toBe(second.id);
		expect(first.getAttribute('aria-describedby')).not.toBe(
			second.getAttribute('aria-describedby')
		);
	});

	it('merges consumer, description, and validation error references', async () => {
		const externalDescription = document.createElement('p');
		externalDescription.id = 'external-help';
		document.body.appendChild(externalDescription);
		render(Textarea, {
			props: {
				label: 'Summary',
				description: 'Describe the change.',
				'aria-describedby': 'external-help',
				validate: () => 'Summary is too short'
			}
		});
		const textarea = screen.getByRole('textbox', { name: 'Summary' });

		await fireEvent.input(textarea, { target: { value: 'x' } });

		const description = screen.getByText('Describe the change.');
		const error = screen.getByText('Summary is too short');
		expect(textarea.getAttribute('aria-describedby')?.split(' ')).toEqual([
			'external-help',
			description.id,
			error.id
		]);
		externalDescription.remove();
	});

	it('validates on input and clears the accessible error when valid', async () => {
		const validate = vi.fn((value: string) => (value.length < 3 ? 'Use at least 3 characters' : null));
		render(Textarea, { props: { label: 'Summary', validate } });
		const textarea = screen.getByRole('textbox', { name: 'Summary' });

		await fireEvent.input(textarea, { target: { value: 'x' } });
		const error = screen.getByText('Use at least 3 characters');
		expect(validate).toHaveBeenCalledWith('x');
		expect(textarea).toHaveAttribute('aria-invalid', 'true');
		expect(textarea).toHaveAttribute('aria-describedby', error.id);
		expect(textarea).toHaveClass('border-red-500');

		await fireEvent.input(textarea, { target: { value: 'valid' } });
		expect(screen.queryByText('Use at least 3 characters')).not.toBeInTheDocument();
		expect(textarea).toHaveAttribute('aria-invalid', 'false');
	});

	it('validates on blur', async () => {
		const validate = vi.fn(() => 'Required');
		render(Textarea, { props: { ariaLabel: 'Notes', validate } });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		await fireEvent.blur(textarea);

		expect(validate).toHaveBeenCalledWith('');
		expect(screen.getByText('Required')).toBeInTheDocument();
	});

	it('logs validator exceptions without interrupting input', async () => {
		const error = new Error('Validation failed');
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		render(Textarea, {
			props: {
				ariaLabel: 'Notes',
				validate: () => {
					throw error;
				}
			}
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes' });

		await expect(
			fireEvent.input(textarea, { target: { value: 'Still editable' } })
		).resolves.toBeTruthy();
		expect(textarea).toHaveValue('Still editable');
		expect(consoleError).toHaveBeenCalledWith('Textarea validator error:', error);
		consoleError.mockRestore();
	});
});
