import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/lists.svelte', () => ({
	saveCategory: vi.fn().mockResolvedValue(undefined),
	deleteCategory: vi.fn().mockResolvedValue(undefined)
}));

import CategoryConfigDialog from './CategoryConfigDialog.svelte';

describe('CategoryConfigDialog color swatches', () => {
	it('selects and deselects edit colors without blurring the active editor', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories: [
					{
						id: 'category-1',
						listId: 'list-1',
						name: 'Produce',
						color: '#f87171',
						sortOrder: 1
					}
				],
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
		const input = screen.getAllByRole('textbox')[0];
		const editor = within(input.closest('.flex-1') as HTMLElement);
		const selected = editor.getByRole('button', { name: 'Color #f87171' });
		expect(selected).toHaveAttribute('aria-pressed', 'true');

		await fireEvent.mouseDown(selected);
		await fireEvent.click(selected);
		expect(selected).toHaveAttribute('aria-pressed', 'false');
		expect(input).toBeInTheDocument();

		const blue = editor.getByRole('button', { name: 'Color #60a5fa' });
		await fireEvent.click(blue);
		expect(blue).toHaveAttribute('aria-pressed', 'true');
	});
});
