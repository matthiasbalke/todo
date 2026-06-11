import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, it, expect, vi } from 'vitest';
import EditableLabel from './EditableLabel.svelte';

describe('EditableLabel', () => {
	describe('display mode', () => {
		it('renders as a non-editable button by default', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello World' }
			});
			const display = container.querySelector('[role="button"]');
			expect(display).toBeTruthy();
			expect(display?.textContent).toBe('Hello World');
		});

		it('shows placeholder when value is empty', () => {
			const { container } = render(EditableLabel, {
				props: { value: '', placeholder: 'Click to edit' }
			});
			const display = container.querySelector('[role="button"]');
			expect(display?.textContent).toBe('Click to edit');
		});

		it('applies disabled styles when disabled', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Test', disabled: true }
			});
			const display = container.querySelector('[role="button"]');
			expect(display).toHaveAttribute('aria-disabled', 'true');
		});

		it('applies disabled styles when isSaving', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Test', isSaving: true }
			});
			const display = container.querySelector('[role="button"]');
			expect(display).toHaveAttribute('aria-disabled', 'true');
		});
	});

	describe('entering edit mode', () => {
		it('enters edit mode when clicked', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input');
			expect(input).toBeTruthy();
			expect(input).toHaveValue('Hello');
		});

		it('enters edit mode on Enter key', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.keyDown(display!, { key: 'Enter' });
			await tick();

			const input = container.querySelector('input');
			expect(input).toBeTruthy();
		});

		it('does not enter edit mode when disabled', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', disabled: true }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input');
			expect(input).toBeFalsy();
		});

		it('shows label in edit mode', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', label: 'Display Name' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const label = container.querySelector('label');
			expect(label?.textContent).toContain('Display Name');
		});
	});

	describe('saving edits', () => {
		it('saves on Enter key', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.keyDown(input, { key: 'Enter' });
			await tick();

			const newDisplay = container.querySelector('[role="button"]');
			expect(newDisplay?.textContent).toBe('World');
		});

		it('saves on blur', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.blur(input);
			await tick();

			const newDisplay = container.querySelector('[role="button"]');
			expect(newDisplay?.textContent).toBe('World');
		});

		it('does not save if value unchanged', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.keyDown(input, { key: 'Enter' });
			await tick();

			const newDisplay = container.querySelector('[role="button"]');
			expect(newDisplay?.textContent).toBe('Hello');
		});
	});

	describe('explicit save mode', () => {
		it('saves only when the Save button is clicked', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', saveMode: 'explicit' }
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.keyDown(input, { key: 'Enter' });

			expect(container.querySelector('input')).toBeInTheDocument();
			expect(container.querySelector('[role="button"]')).not.toBeInTheDocument();

			await fireEvent.click(container.querySelector('button')!);

			expect(container.querySelector('[role="button"]')).toHaveTextContent('World');
		});

		it('discards the draft when focus leaves the editor', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', saveMode: 'explicit' }
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.focusOut(input, { relatedTarget: null });

			expect(container.querySelector('[role="button"]')).toHaveTextContent('Hello');
		});

		it('cancels the draft on Escape', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', saveMode: 'explicit' }
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.keyDown(input, { key: 'Escape' });

			expect(container.querySelector('[role="button"]')).toHaveTextContent('Hello');
		});

		it('keeps the editor open when Save validation fails', async () => {
			const { container } = render(EditableLabel, {
				props: {
					value: 'Hello',
					saveMode: 'explicit',
					validate: (val: string) => (val.length < 5 ? 'Too short' : null)
				}
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'Hi' } });
			await fireEvent.click(container.querySelector('button')!);

			expect(container.querySelector('input')).toHaveValue('Hi');
			expect(container.querySelector('[id$="-error"]')).toHaveTextContent('Too short');
		});

		it('disables the input and Save button while saving', async () => {
			const { container, rerender } = render(EditableLabel, {
				props: { value: 'Hello', saveMode: 'explicit' }
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);
			await rerender({ value: 'Hello', saveMode: 'explicit', isSaving: true });

			expect(container.querySelector('input')).toBeDisabled();
			expect(container.querySelector('button')).toBeDisabled();
			expect(container.querySelector('button')).toHaveTextContent('Saving…');
		});

		it('does not dismiss before a Save click when focusout has no related target', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', saveMode: 'explicit' }
			});
			await fireEvent.click(container.querySelector('[role="button"]')!);

			const input = container.querySelector('input') as HTMLInputElement;
			const saveButton = container.querySelector('button')!;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.mouseDown(saveButton);
			await fireEvent.focusOut(input, { relatedTarget: null });

			expect(container.querySelector('input')).toBeInTheDocument();

			await fireEvent.click(saveButton);
			expect(container.querySelector('[role="button"]')).toHaveTextContent('World');
		});
	});

	describe('canceling edits', () => {
		it('exits edit mode on Escape key', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'World' } });
			await fireEvent.keyDown(input, { key: 'Escape' });
			await tick();

			const newDisplay = container.querySelector('[role="button"]');
			expect(newDisplay?.textContent).toBe('Hello');
		});

		it('does not save if validation fails on blur', async () => {
			const { container } = render(EditableLabel, {
				props: {
					value: 'Hello',
					validate: (val: string) => (val.length < 5 ? 'Too short' : null)
				}
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'Hi' } });
			await fireEvent.blur(input);
			await tick();

			const errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage?.textContent).toContain('Too short');
			expect(input).toHaveValue('Hi');
		});
	});

	describe('validation', () => {
		it('shows error message on invalid input', async () => {
			const { container } = render(EditableLabel, {
				props: {
					value: 'Hello',
					validate: (val: string) => (val === '' ? 'Required' : null)
				}
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);
			await tick();

			const errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage?.textContent).toContain('Required');
		});

		it('applies error styling to input', async () => {
			const { container } = render(EditableLabel, {
				props: {
					value: 'Hello',
					validate: (val: string) => (val === '' ? 'Required' : null)
				}
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);
			await tick();

			expect(input).toHaveClass('border-red-500', 'bg-red-50');
		});
	});

	describe('accessibility', () => {
		it('has aria-label in display mode', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', label: 'Name', ariaLabel: 'Edit name' }
			});
			const display = container.querySelector('[role="button"]');
			expect(display).toHaveAttribute('aria-label', 'Edit name');
		});

		it('uses label text in aria-label if not provided', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello', label: 'Display Name' }
			});
			const display = container.querySelector('[role="button"]');
			expect(display?.getAttribute('aria-label')).toContain('Display Name');
		});
	});

	describe('props', () => {
		it('respects type prop', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'test@example.com', type: 'email' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input') as HTMLInputElement;
			expect(input).toHaveAttribute('type', 'email');
		});

		it('respects placeholder prop', async () => {
			const { container } = render(EditableLabel, {
				props: { value: '', placeholder: 'Enter text' }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('placeholder', 'Enter text');
		});

		it('respects required prop', async () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Test', required: true }
			});
			const display = container.querySelector('[role="button"]');
			await fireEvent.click(display!);
			await tick();

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('required');
		});
	});

	describe('edge cases', () => {
		it('handles special characters in value', () => {
			const { container } = render(EditableLabel, {
				props: { value: 'Hello & "World"' }
			});

			const display = container.querySelector('[role="button"]');
			expect(display?.textContent).toContain('Hello & "World"');
		});

		it('handles very long values', () => {
			const longValue = 'A'.repeat(500);
			const { container } = render(EditableLabel, {
				props: { value: longValue }
			});

			const display = container.querySelector('[role="button"]');
			expect(display?.textContent).toBe(longValue);
		});

		it('handles empty values', () => {
			const { container } = render(EditableLabel, {
				props: { value: '', placeholder: 'Click to edit' }
			});

			const display = container.querySelector('[role="button"]');
			expect(display?.textContent).toBe('Click to edit');
		});
	});
});
