import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CompletionToggle from './CompletionToggle.svelte';
import StarToggle from './StarToggle.svelte';

describe('CompletionToggle', () => {
	it('owns done state and activates once for mouse or touch', async () => {
		const onactivate = vi.fn();
		const { rerender } = render(CompletionToggle, { props: { done: false, onactivate } });
		const toggle = screen.getByRole('button', { name: 'Mark done' });

		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		expect(toggle).toHaveClass('border-gray-300');
		await fireEvent.click(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		onactivate.mockClear();
		await fireEvent.touchEnd(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		await rerender({ done: true, onactivate });
		expect(screen.getByRole('button', { name: 'Mark undone' })).toHaveClass('bg-green-500');
	});

	it('does not activate while disabled', async () => {
		const onactivate = vi.fn();
		render(CompletionToggle, { props: { done: false, disabled: true, onactivate } });
		await fireEvent.click(screen.getByRole('button'));
		expect(onactivate).not.toHaveBeenCalled();
	});
});

describe('StarToggle', () => {
	it('owns starred state and activates once for mouse or touch', async () => {
		const onactivate = vi.fn();
		const { rerender } = render(StarToggle, { props: { starred: false, onactivate } });
		const toggle = screen.getByRole('button', { name: 'Star' });

		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		expect(toggle).toHaveClass('text-gray-200');
		await fireEvent.click(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		onactivate.mockClear();
		await fireEvent.touchEnd(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		await rerender({ starred: true, onactivate });
		expect(screen.getByRole('button', { name: 'Unstar' })).toHaveClass('text-yellow-400');
	});

	it('stops touch propagation and does not activate while disabled', async () => {
		const onactivate = vi.fn();
		const parentTouch = vi.fn();
		const { container } = render(StarToggle, {
			props: { starred: false, onactivate }
		});
		container.addEventListener('touchend', parentTouch);

		await fireEvent.touchEnd(screen.getByRole('button'));
		expect(parentTouch).not.toHaveBeenCalled();
		expect(onactivate).toHaveBeenCalledOnce();

		onactivate.mockClear();
		await render(StarToggle, {
			props: { starred: false, disabled: true, onactivate }
		});
		await fireEvent.click(screen.getAllByRole('button')[1]);
		expect(onactivate).not.toHaveBeenCalled();
	});
});
