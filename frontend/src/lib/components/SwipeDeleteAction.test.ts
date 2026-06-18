import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SwipeDeleteAction from './SwipeDeleteAction.svelte';

describe('SwipeDeleteAction', () => {
	it('owns destructive presentation and default gesture geometry', async () => {
		const onactivate = vi.fn();
		render(SwipeDeleteAction, { props: { onactivate } });
		const action = screen.getByRole('button', { name: 'Delete item' });

		expect(action).toHaveClass('bg-red-600', 'text-white', 'w-20', 'h-full');
		await fireEvent.click(action);
		expect(onactivate).toHaveBeenCalledOnce();
	});

	it('supports the narrow geometry and accessible-label contract', () => {
		render(SwipeDeleteAction, {
			props: { label: 'Remove grocery item', width: 'wide', fillHeight: false }
		});
		const action = screen.getByRole('button', { name: 'Remove grocery item' });

		expect(action).toHaveClass('w-24');
		expect(action).not.toHaveClass('h-full');
	});
});
