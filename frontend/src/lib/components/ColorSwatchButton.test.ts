import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ColorSwatchButton from './ColorSwatchButton.svelte';

describe('ColorSwatchButton', () => {
	it('applies arbitrary color data and accessible selected state', () => {
		render(ColorSwatchButton, {
			props: { color: 'oklch(70% 0.2 40)', selected: true, label: 'Warm accent' }
		});
		const swatch = screen.getByRole('button', { name: 'Warm accent' });

		expect(swatch).toHaveAttribute('aria-pressed', 'true');
		expect(swatch).toHaveStyle({ backgroundColor: 'oklch(70% 0.2 40)' });
		expect(swatch).toHaveClass('scale-110', 'border-gray-700', 'focus:ring-2');
	});

	it('reports its color and preserves an active editor on pointer activation', async () => {
		const onselect = vi.fn();
		render(ColorSwatchButton, { props: { color: '#60a5fa', onselect } });
		const swatch = screen.getByRole('button', { name: 'Color #60a5fa' });
		const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

		swatch.dispatchEvent(mouseDown);
		await fireEvent.click(swatch);

		expect(mouseDown.defaultPrevented).toBe(true);
		expect(onselect).toHaveBeenCalledOnce();
		expect(onselect).toHaveBeenCalledWith('#60a5fa');
		expect(swatch).toHaveAttribute('aria-pressed', 'false');
		expect(swatch).toHaveClass('border-transparent');
	});
});
