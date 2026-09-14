import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CategoryColorPicker, { normalizeHexColor } from './CategoryColorPicker.svelte';

const presets = ['#f87171', '#60a5fa'];

describe('normalizeHexColor', () => {
	it('normalizes valid long and shorthand hex values', () => {
		expect(normalizeHexColor('#60a5fa')).toBe('#60A5FA');
		expect(normalizeHexColor('60a5fa')).toBe('#60A5FA');
		expect(normalizeHexColor('#3af')).toBe('#33AAFF');
	});

	it('rejects invalid hex values', () => {
		expect(normalizeHexColor('#zzzzzz')).toBeNull();
		expect(normalizeHexColor('#1234')).toBeNull();
		expect(normalizeHexColor('')).toBeNull();
	});
});

describe('CategoryColorPicker', () => {
	it('shows the no-color preview from the beginning and keeps the hex input in the swatch row', () => {
		render(CategoryColorPicker, { props: { value: null, presets } });
		const none = screen.getByRole('button', { name: 'Category color no color' });
		const input = screen.getByRole('textbox', { name: 'Category color custom hex' });

		expect(none).toHaveAttribute('aria-pressed', 'true');
		expect(none.querySelector('span')).toHaveClass('border-dashed');
		expect(input.closest('.flex.flex-wrap')).toBe(none.closest('.flex.flex-wrap'));
		expect(input.closest('.min-w-24')).toHaveClass('max-w-28', 'flex-1');
	});

	it('can hide the preview while keeping presets and compact hex input together', () => {
		render(CategoryColorPicker, { props: { value: null, presets, showPreview: false } });
		const input = screen.getByRole('textbox', { name: 'Category color custom hex' });

		expect(screen.queryByRole('button', { name: 'Category color no color' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Category color #f87171' })).toBeInTheDocument();
		expect(input.closest('.min-w-24')).toHaveClass('max-w-28', 'flex-1');
	});

	it('does not draw a border around colored previews', () => {
		render(CategoryColorPicker, { props: { value: '#60A5FA', presets } });
		const preview = screen.getByRole('button', { name: 'Category color no color' }).querySelector('span');

		expect(preview).not.toHaveClass('border');
		expect(preview).toHaveStyle({ backgroundColor: '#60A5FA' });
	});

	it('emits preset and clear selections immediately', async () => {
		const onselect = vi.fn();
		render(CategoryColorPicker, { props: { value: null, presets, onselect } });

		await fireEvent.click(screen.getByRole('button', { name: 'Category color #60a5fa' }));
		expect(onselect).toHaveBeenLastCalledWith('#60a5fa');

		await fireEvent.click(screen.getByRole('button', { name: 'Category color no color' }));
		expect(onselect).toHaveBeenLastCalledWith(null);
	});

	it('commits normalized custom hex values on Enter and blur', async () => {
		const onselect = vi.fn();
		render(CategoryColorPicker, { props: { value: null, presets, onselect } });
		const input = screen.getByRole('textbox', { name: 'Category color custom hex' });

		await fireEvent.input(input, { target: { value: '#3af' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onselect).toHaveBeenLastCalledWith('#33AAFF');

		await fireEvent.input(input, { target: { value: '60a5fa' } });
		await fireEvent.blur(input);
		expect(onselect).toHaveBeenLastCalledWith('#60A5FA');
	});

	it('keeps invalid custom hex local and reports validation', async () => {
		const onselect = vi.fn();
		render(CategoryColorPicker, { props: { value: null, presets, onselect } });
		const input = screen.getByRole('textbox', { name: 'Category color custom hex' });

		await fireEvent.input(input, { target: { value: '#nope' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(screen.getByText('Enter a hex color like #60A5FA')).toBeInTheDocument();
		expect(onselect).not.toHaveBeenCalled();
		expect(input).toHaveValue('#nope');
	});
});
