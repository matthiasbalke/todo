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
		expect(button).toHaveClass('justify-center');
		expect(button).toHaveClass('font-medium');
	});

	it.each([
		['center', 'justify-center'],
		['start', 'justify-start'],
		['between', 'justify-between']
	] as const)('renders the %s content alignment', (align, expectedClass) => {
		render(Button, {
			props: {
				children: text(align),
				align,
				tone: 'neutral',
				appearance: 'bare',
				size: 'menu',
				class: 'w-full'
			}
		});

		expect(screen.getByRole('button')).toHaveClass(expectedClass, 'w-full', 'text-left');
	});

	it.each([
		['normal', 'font-normal'],
		['medium', 'font-medium']
	] as const)('renders the %s font weight', (weight, expectedClass) => {
		render(Button, {
			props: {
				children: text(weight),
				weight,
				tone: 'neutral',
				appearance: 'bare',
				align: 'start',
				class: 'w-full'
			}
		});

		expect(screen.getByRole('button')).toHaveClass(
			expectedClass,
			'bg-transparent',
			'justify-start',
			'w-full'
		);
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
		['primary', 'solid', 'bg-blue-600'],
		['primary', 'outline', 'border-blue-300'],
		['primary', 'soft', 'bg-blue-50'],
		['primary', 'ghost', 'hover:bg-blue-50'],
		['primary', 'bare', 'text-blue-600'],
		['neutral', 'solid', 'bg-gray-700'],
		['neutral', 'outline', 'border-gray-300'],
		['neutral', 'soft', 'bg-gray-50'],
		['neutral', 'ghost', 'hover:bg-gray-100'],
		['neutral', 'bare', 'text-gray-700'],
		['danger', 'solid', 'bg-red-600'],
		['danger', 'outline', 'border-red-300'],
		['danger', 'soft', 'bg-red-50'],
		['danger', 'ghost', 'hover:bg-red-50'],
		['danger', 'bare', 'text-red-600'],
		['success', 'solid', 'bg-green-600'],
		['success', 'outline', 'border-green-300'],
		['success', 'soft', 'bg-green-50'],
		['success', 'ghost', 'hover:bg-green-50'],
		['success', 'bare', 'text-green-600']
	] as const)('renders the %s %s presentation', (tone, appearance, expectedClass) => {
		render(Button, {
			props: {
				children: text(`${tone}-${appearance}`),
				tone,
				appearance
			}
		});

		expect(screen.getByRole('button')).toHaveClass(expectedClass);
	});

	it('owns selected option styling', () => {
		render(Button, {
			props: {
				children: text('Selected option'),
				tone: 'neutral',
				appearance: 'bare',
				selected: true,
				size: 'menu-indented'
			}
		});

		const button = screen.getByRole('button', { name: 'Selected option' });
		expect(button).toHaveClass('text-menu-selected', 'px-6');
	});

	it('owns active, invalid, and neutral emphasis states', async () => {
		const { rerender } = render(Button, {
			props: { children: text('Stateful'), tone: 'neutral', appearance: 'bare', active: true }
		});
		expect(screen.getByRole('button')).toHaveClass('bg-blue-100');

		await rerender({ children: text('Stateful'), tone: 'neutral', appearance: 'outline', invalid: true });
		expect(screen.getByRole('button')).toHaveClass('border-red-500', 'bg-red-50');

		await rerender({
			children: text('Stateful'),
			tone: 'neutral',
			appearance: 'bare',
			emphasis: 'muted',
			active: false,
			invalid: false
		});
		expect(screen.getByRole('button')).toHaveClass('text-gray-500', 'hover:text-gray-700');
	});

	it.each([
		['default', 'px-4'],
		['large', 'py-2.5'],
		['small', 'px-3'],
		['compact', 'text-xs'],
		['icon', 'p-1'],
		['menu', 'rounded-none'],
		['menu-indented', 'px-6'],
		['chip', 'rounded-full'],
		['backdrop', 'p-0'],
		['field', 'px-3'],
		['display', 'min-h-10'],
		['display-plain', 'p-0'],
		['empty', 'border-dashed'],
		['header', 'uppercase'],
		['row', 'py-3'],
		['row-muted', 'rounded-xl'],
		['title', 'text-xl']
	] as const)('renders the %s size', (size, expectedClass) => {
		render(Button, { props: { children: text(size), size } });
		expect(screen.getByRole('button')).toHaveClass(expectedClass);
	});

	it('supports accessible icon-only usage', () => {
		render(Button, { props: { children: text('★'), size: 'icon', 'aria-label': 'Star item' } });
		expect(screen.getByRole('button', { name: 'Star item' })).toBeInTheDocument();
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

	it('merges layout classes with base presentation classes', () => {
		render(Button, {
			props: { children: text('Full width'), align: 'between', class: 'w-full' }
		});

		expect(screen.getByRole('button')).toHaveClass(
			'inline-flex',
			'bg-blue-600',
			'w-full',
			'justify-between'
		);
	});
});
