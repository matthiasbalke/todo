import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Button from './Button.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

afterEach(cleanup);

describe('Button', () => {
	it('renders child content and defaults to type button', () => {
		render(Button, { props: { children: text('Continue') } });

		const button = screen.getByRole('button', { name: 'Continue' });
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveClass('bg-blue-600');
	});

	it('supports mixed child markup', () => {
		const children = createRawSnippet(() => ({
			render: () => '<span><span aria-hidden="true">+</span><span>Add item</span></span>'
		}));
		render(Button, { props: { children } });

		expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
	});

	it('forwards native click handlers and attributes', async () => {
		const onclick = vi.fn();
		render(Button, {
			props: {
				children: text('Details'),
				onclick,
				title: 'Open details',
				'data-testid': 'details-button'
			}
		});

		const button = screen.getByTestId('details-button');
		await fireEvent.click(button);

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(button).toHaveAttribute('title', 'Open details');
	});

	it('supports native submit behavior', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const { container } = render(Button, {
			props: { children: text('Submit'), type: 'submit' }
		});
		const button = screen.getByRole('button', { name: 'Submit' });
		const form = document.createElement('form');
		form.addEventListener('submit', onsubmit);
		form.append(button);
		container.append(form);

		await fireEvent.click(button);

		expect(button).toHaveAttribute('type', 'submit');
		expect(onsubmit).toHaveBeenCalledOnce();
	});

	it.each([
		['primary', 'bg-blue-600'],
		['secondary', 'border-gray-300'],
		['danger', 'bg-red-600']
	] as const)('renders the %s variant', (variant, expectedClass) => {
		render(Button, { props: { children: text(variant), variant } });

		expect(screen.getByRole('button')).toHaveClass(expectedClass);
	});

	it('prevents clicks while disabled', async () => {
		const onclick = vi.fn();
		render(Button, { props: { children: text('Disabled'), disabled: true, onclick } });

		const button = screen.getByRole('button', { name: 'Disabled' });
		await fireEvent.click(button);

		expect(button).toBeDisabled();
		expect(onclick).not.toHaveBeenCalled();
	});

	it('shows the default loading state and prevents clicks', async () => {
		const onclick = vi.fn();
		render(Button, { props: { children: text('Save'), loading: true, onclick } });

		const button = screen.getByRole('button', { name: 'Loading…' });
		await fireEvent.click(button);

		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(onclick).not.toHaveBeenCalled();
		expect(screen.queryByText('Save')).not.toBeInTheDocument();
	});

	it('supports a custom loading label', () => {
		render(Button, {
			props: { children: text('Create account'), loading: true, loadingLabel: 'Creating account…' }
		});

		expect(screen.getByRole('button', { name: 'Creating account…' })).toBeInTheDocument();
	});

	it('merges consumer classes with base and variant classes', () => {
		render(Button, {
			props: { children: text('Full width'), class: 'w-full justify-between' }
		});

		expect(screen.getByRole('button')).toHaveClass(
			'inline-flex',
			'bg-blue-600',
			'w-full',
			'justify-between'
		);
	});
});
