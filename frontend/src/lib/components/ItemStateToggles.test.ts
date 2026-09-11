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
		expect(toggle).toHaveClass('text-faint');
		expect(toggle.querySelector('svg.lucide-circle')).not.toBeNull();
		await fireEvent.click(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		onactivate.mockClear();
		await fireEvent.touchEnd(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		await rerender({ done: true, onactivate });
		const doneToggle = screen.getByRole('button', { name: 'Mark undone' });
		expect(doneToggle).toHaveClass('text-success-indicator');
		expect(doneToggle.querySelector('svg.lucide-circle-check')).not.toBeNull();
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
		expect(toggle).toHaveClass('text-inactive');
		expect(toggle.querySelector('svg.lucide-star')).not.toBeNull();
		await fireEvent.click(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		onactivate.mockClear();
		await fireEvent.touchEnd(toggle);
		expect(onactivate).toHaveBeenCalledOnce();

		await rerender({ starred: true, onactivate });
		const starredToggle = screen.getByRole('button', { name: 'Unstar' });
		expect(starredToggle).toHaveClass('text-warning-highlight');
		expect(starredToggle.querySelector('svg.lucide-star')).toHaveAttribute('fill', 'currentColor');
	});

	it('shows focus treatment only for keyboard-visible focus', () => {
		render(StarToggle, { props: { starred: false } });
		const toggle = screen.getByRole('button', { name: 'Star' });

		expect(toggle).toHaveClass(
			'focus:outline-none',
			'focus-visible:ring-2',
			'focus-visible:ring-focus-warning',
			'focus-visible:ring-offset-1'
		);
		expect(toggle).not.toHaveClass('focus:ring-2', 'focus:ring-focus-warning');
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
