import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeMocks = vi.hoisted(() => ({
	saveCategory: vi.fn().mockResolvedValue(undefined),
	deleteCategory: vi.fn().mockResolvedValue(undefined),
	reorderCategoriesOptimistic: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/stores/lists.svelte', () => ({
	saveCategory: storeMocks.saveCategory,
	deleteCategory: storeMocks.deleteCategory,
	reorderCategoriesOptimistic: storeMocks.reorderCategoriesOptimistic,
}));

vi.mock('svelte-dnd-action', () => ({
	SHADOW_ITEM_MARKER_PROPERTY_NAME: '__isDndShadowItem',
	dragHandleZone: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
	dragHandle: vi.fn(() => ({ destroy: vi.fn() })),
}));

import CategoryConfigDialog from './CategoryConfigDialog.svelte';
import type { Category } from '$lib/mock-data';

const categories: Category[] = [
	{
		id: 'category-1',
		listId: 'list-1',
		name: 'Produce',
		color: '#f87171',
		sortOrder: 1
	},
	{
		id: 'category-2',
		listId: 'list-1',
		name: 'Dairy',
		color: null,
		sortOrder: 2
	}
];

beforeEach(() => {
	vi.clearAllMocks();
	storeMocks.saveCategory.mockResolvedValue(undefined);
	storeMocks.deleteCategory.mockResolvedValue(undefined);
	storeMocks.reorderCategoriesOptimistic.mockResolvedValue(undefined);
});

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

describe('CategoryConfigDialog category reordering', () => {
	it('renders drag handles instead of up and down reorder buttons', () => {
		const { container } = render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		expect(container.querySelectorAll('[aria-label="Drag to reorder category"]')).toHaveLength(2);
		expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Move down' })).not.toBeInTheDocument();
	});

	it('persists finalized drag order through the store', async () => {
		const { container } = render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		const zone = container.querySelector('[data-testid="category-reorder-zone"]');
		await fireEvent(
			zone as Element,
			new CustomEvent('finalize', {
				detail: { items: [categories[1], categories[0]] },
				bubbles: true,
			}),
		);

		expect(storeMocks.reorderCategoriesOptimistic).toHaveBeenCalledWith('list-1', ['category-2', 'category-1']);
	});

	it('keeps rename, color, delete, and add controls available while rows are draggable', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		expect(screen.getAllByRole('button', { name: 'Rename' })).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: /^Color / })).toHaveLength(8);
		expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
	});

	it('shows reorder errors and restores previous row order on failure', async () => {
		storeMocks.reorderCategoriesOptimistic.mockRejectedValue(new Error('No connection'));
		const { container } = render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		const zone = container.querySelector('[data-testid="category-reorder-zone"]');
		await fireEvent(
			zone as Element,
			new CustomEvent('finalize', {
				detail: { items: [categories[1], categories[0]] },
				bubbles: true,
			}),
		);

		expect(await screen.findByText('Failed to reorder')).toBeInTheDocument();
		const rowText = Array.from(container.querySelectorAll('[data-testid="category-reorder-zone"] [role="button"][tabindex="0"]'))
			.map(element => element.textContent);
		expect(rowText).toEqual(['Produce', 'Dairy']);
	});
});
