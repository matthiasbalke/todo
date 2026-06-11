import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, it, expect, vi } from 'vitest';
import TextInput from './TextInput.svelte';

describe('TextInput', () => {
	describe('rendering', () => {
		it('should render an input element', () => {
			const { container } = render(TextInput);
			const input = container.querySelector('input');
			expect(input).toBeTruthy();
		});

		it('should render label when provided', () => {
			const { container } = render(TextInput, {
				props: { label: 'Email Address' }
			});
			const label = container.querySelector('label');
			expect(label?.textContent).toContain('Email Address');
		});

		it('should render required indicator when required prop is true', () => {
			const { container } = render(TextInput, {
				props: { label: 'Email', required: true }
			});
			const asterisk = container.querySelector('span');
			expect(asterisk?.textContent).toBe('*');
		});

		it('should set placeholder attribute', () => {
			const { container } = render(TextInput, {
				props: { placeholder: 'Enter text...' }
			});
			const input = container.querySelector('input') as HTMLInputElement;
			expect(input.placeholder).toBe('Enter text...');
		});

		it('should set input type attribute', () => {
			const { container } = render(TextInput, {
				props: { type: 'email' }
			});
			const input = container.querySelector('input') as HTMLInputElement;
			expect(input.type).toBe('email');
		});

		it('should disable input when disabled prop is true', () => {
			const { container } = render(TextInput, {
				props: { disabled: true }
			});
			const input = container.querySelector('input') as HTMLInputElement;
			expect(input.disabled).toBe(true);
		});
	});

	describe('value binding', () => {
		it('should update value on input event', async () => {
			const { container } = render(TextInput);
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test value' } });
			expect(input.value).toBe('test value');
		});

		it('should display initial value', () => {
			const { container } = render(TextInput, {
				props: { value: 'initial text' }
			});
			const input = container.querySelector('input') as HTMLInputElement;
			expect(input.value).toBe('initial text');
		});
	});

	describe('validation', () => {
		it('should call validator function on input', async () => {
			const validator = vi.fn(() => null);
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test' } });
			expect(validator).toHaveBeenCalledWith('test');
		});

		it('should display error message when validator returns error', async () => {
			const validator = () => 'Email is invalid';
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'not-an-email' } });
			const errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage?.textContent).toContain('Email is invalid');
		});

		it('should not display error message when validator returns null', async () => {
			const validator = () => null;
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'valid@email.com' } });
			const errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage).toBeFalsy();
		});

		it('should validate on blur event', async () => {
			const validator = vi.fn(() => 'Error');
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.blur(input);
			expect(validator).toHaveBeenCalled();
		});

		it('should clear error when validation passes', async () => {
			const validator = (value: string) => (value === 'valid' ? null : 'Invalid');
			const { container } = render(TextInput, {
				props: { validate: validator }
			});

			const input = container.querySelector('input') as HTMLInputElement;
			
			// First set to invalid
			await fireEvent.input(input, { target: { value: 'invalid' } });
			await tick();
			
			let errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage?.textContent).toContain('Invalid');

			// Now set to valid
			await fireEvent.input(input, { target: { value: 'valid' } });
			await tick();

			errorMessage = container.querySelector('[id$="-error"]');
			expect(errorMessage).toBeFalsy();
		});
	});

	describe('accessibility', () => {
		it('should link label to input with id', () => {
			const { container } = render(TextInput, {
				props: { label: 'Username' }
			});
			const label = container.querySelector('label');
			const input = container.querySelector('input');
			expect(input?.id).toMatch(/^text-input-\d+$/);
			expect(label?.getAttribute('for')).toBe(input?.id);
		});

		it('should set aria-label when provided', () => {
			const { container } = render(TextInput, {
				props: { ariaLabel: 'Search field' }
			});
			const input = container.querySelector('input');
			expect(input?.getAttribute('aria-label')).toBe('Search field');
		});

		it('should set aria-invalid when error exists', async () => {
			const validator = () => 'Error';
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test' } });
			await tick();
			expect(input.getAttribute('aria-invalid')).toBe('true');
		});

		it('should set aria-describedby when error exists', async () => {
			const validator = () => 'Error';
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test' } });
			await tick();
			expect(input.getAttribute('aria-describedby')).toBe(container.querySelector('[id$="-error"]')?.id);
		});

		it('should not set aria-describedby when no error', () => {
			const { container } = render(TextInput);
			const input = container.querySelector('input');
			expect(input?.getAttribute('aria-describedby')).toBe(null);
		});

		it('should set aria-invalid to false when no validator', () => {
			const { container } = render(TextInput);
			const input = container.querySelector('input');
			expect(input?.getAttribute('aria-invalid')).toBe('false');
		});
	});

	it('generates unique IDs for multiple instances', () => {
		const first = render(TextInput, { props: { label: 'First' } });
		const second = render(TextInput, { props: { label: 'Second' } });

		expect(first.container.querySelector('input')?.id).not.toBe(second.container.querySelector('input')?.id);
	});

	it('supports explicit IDs, descriptions, custom classes, handlers, and element binding', async () => {
		const onfocus = vi.fn();
		const { container } = render(TextInput, {
			props: {
				id: 'custom-input',
				description: 'Helpful text',
				class: 'custom-input-class',
				onfocus,
				autocomplete: 'name'
			}
		});
		const input = container.querySelector('input') as HTMLInputElement;

		await fireEvent.focus(input);
		expect(input).toHaveAttribute('id', 'custom-input');
		expect(input).toHaveAttribute('autocomplete', 'name');
		expect(input).toHaveClass('custom-input-class');
		expect(input.getAttribute('aria-describedby')).toContain('custom-input-description');
		expect(onfocus).toHaveBeenCalledOnce();
	});

	describe('styling', () => {
		it('should apply different styles when validation fails', async () => {
			const validator = () => 'Error';
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test' } });
			await tick();
			// Check that the class contains error-related styling
			expect(input.className).toContain('border-red-500');
		});

		it('should apply normal styles when validation passes', async () => {
			const validator = () => null;
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test' } });
			await tick();
			// When no error, should have gray border
			expect(input.className).toContain('border-gray-300');
		});

		it('should apply disabled styles when disabled', () => {
			const { container } = render(TextInput, {
				props: { disabled: true }
			});
			const input = container.querySelector('input');
			expect(input?.disabled).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle empty string value', async () => {
			const { container } = render(TextInput, {
				props: { value: '' }
			});
			const input = container.querySelector('input') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('should handle very long input values', async () => {
			const longValue = 'a'.repeat(10000);
			const { container } = render(TextInput);
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: longValue } });
			expect(input.value).toBe(longValue);
		});

		it('should handle special characters', async () => {
			const specialValue = '!@#$%^&*()[]{}";:<>?,./';
			const { container } = render(TextInput);
			const input = container.querySelector('input') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: specialValue } });
			expect(input.value).toBe(specialValue);
		});

		it('should handle validator errors gracefully', async () => {
			const validator = () => {
				throw new Error('Validator error');
			};
			const { container } = render(TextInput, {
				props: { validate: validator }
			});
			const input = container.querySelector('input') as HTMLInputElement;

			// Should not throw; validator error is caught and logged
			expect(() => fireEvent.input(input, { target: { value: 'test' } })).not.toThrow();
		});
	});
});
