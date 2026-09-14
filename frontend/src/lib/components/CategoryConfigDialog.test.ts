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
	it('edits existing category colors from the row color control', async () => {
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

		await fireEvent.click(screen.getByRole('button', { name: 'Edit color for Produce' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Color for Produce #60a5fa' }));

		expect(storeMocks.saveCategory).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: 'category-1', name: 'Produce', color: '#60a5fa' })
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Color for Produce no color' }));
		expect(storeMocks.saveCategory).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: 'category-1', color: null })
		);
	});

	it('commits normalized existing custom hex colors on Enter and rejects invalid values', async () => {
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

		await fireEvent.click(screen.getByRole('button', { name: 'Edit color for Produce' }));
		const input = screen.getByRole('textbox', { name: 'Color for Produce custom hex' });
		await fireEvent.input(input, { target: { value: '#3af' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(storeMocks.saveCategory).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: 'category-1', color: '#33AAFF' })
		);

		storeMocks.saveCategory.mockClear();
		await fireEvent.input(input, { target: { value: '#nope' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(screen.getByText('Enter a hex color like #60A5FA')).toBeInTheDocument();
		expect(storeMocks.saveCategory).not.toHaveBeenCalled();
	});
});

describe('CategoryConfigDialog category name editing', () => {
	it('persists category names on blur without save or discard buttons', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Edit category name Produce' }));
		const input = screen.getByRole('textbox', { name: 'Edit category name Produce' });
		await fireEvent.input(input, { target: { value: 'Fresh produce' } });
		await fireEvent.blur(input);

		expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
		expect(storeMocks.saveCategory).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'category-1', name: 'Fresh produce', color: '#f87171', sortOrder: 1 })
		);
	});

	it('persists category names on Enter and cancels drafts on Escape', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Edit category name Produce' }));
		let input = screen.getByRole('textbox', { name: 'Edit category name Produce' });
		await fireEvent.input(input, { target: { value: 'Fresh produce' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(storeMocks.saveCategory).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'category-1', name: 'Fresh produce' })
		);

		storeMocks.saveCategory.mockClear();
		await fireEvent.click(screen.getByRole('button', { name: 'Edit category name Dairy' }));
		input = screen.getByRole('textbox', { name: 'Edit category name Dairy' });
		await fireEvent.input(input, { target: { value: 'Milk' } });
		await fireEvent.keyDown(input, { key: 'Escape' });

		expect(storeMocks.saveCategory).not.toHaveBeenCalled();
	});

	it('rejects empty category names', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Edit category name Produce' }));
		const input = screen.getByRole('textbox', { name: 'Edit category name Produce' });
		await fireEvent.input(input, { target: { value: '   ' } });
		await fireEvent.blur(input);

		expect(screen.getByText('Category name is required')).toBeInTheDocument();
		expect(storeMocks.saveCategory).not.toHaveBeenCalled();
	});
});

describe('CategoryConfigDialog category creation colors', () => {
	it('shows the new category no-color preview before a color is selected', () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		const noColor = screen.getByRole('button', { name: 'New category color no color' });
		const nameInput = screen.getByPlaceholderText('New category name');
		const nameRow = nameInput.closest('.gap-2');
		expect(noColor).toHaveAttribute('aria-pressed', 'true');
		expect(noColor.querySelector('span')).toHaveClass('border-dashed');
		expect(nameRow).toContainElement(noColor);
		expect(noColor.compareDocumentPosition(nameInput)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});

	it('creates a category with a preset color', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'New category color #60a5fa' }));
		await fireEvent.input(screen.getByPlaceholderText('New category name'), { target: { value: 'Frozen' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(storeMocks.saveCategory).toHaveBeenCalledWith(
			expect.objectContaining({ listId: 'list-1', name: 'Frozen', color: '#60a5fa', sortOrder: 3 })
		);
	});

	it('creates a category with a normalized custom hex color', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.input(screen.getByRole('textbox', { name: 'New category color custom hex' }), {
			target: { value: '#3af' }
		});
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'New category color custom hex' }), { key: 'Enter' });
		await fireEvent.input(screen.getByPlaceholderText('New category name'), { target: { value: 'Frozen' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(storeMocks.saveCategory).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Frozen', color: '#33AAFF' })
		);
	});

	it('creates a category without a color when no color is selected', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.input(screen.getByPlaceholderText('New category name'), { target: { value: 'Frozen' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add' }));

		expect(storeMocks.saveCategory).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Frozen', color: null })
		);
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
		expect(container.querySelector('[aria-label="Drag to reorder category"]')?.querySelector('svg')).not.toBeNull();
		expect(container.querySelector('[aria-label="Drag to reorder category"] svg')).toHaveClass('lucide-grip-vertical');
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

		expect(screen.getAllByRole('button', { name: /^Edit category name / })).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: /^Edit color for / })).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
		expect(screen.getAllByRole('button', { name: /^New category color / })).toHaveLength(9);
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
		const rowText = Array.from(container.querySelectorAll('[data-testid="category-reorder-zone"] button[aria-label^="Edit category name"]'))
			.map(element => element.textContent);
		expect(rowText).toEqual(['Produce', 'Dairy']);
	});
});

describe('CategoryConfigDialog category deletion', () => {
	it('asks for confirmation before deleting a category', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

		expect(storeMocks.deleteCategory).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog', { name: 'Delete category?' })).toBeInTheDocument();
		expect(screen.getByText('delete category Produce')).toBeInTheDocument();
	});

	it('cancels category deletion without calling the store', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(storeMocks.deleteCategory).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog', { name: 'Delete category?' })).not.toBeInTheDocument();
	});

	it('deletes the category after confirmation', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
		const dialog = screen.getByRole('dialog', { name: 'Delete category?' });
		await fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

		expect(storeMocks.deleteCategory).toHaveBeenCalledOnce();
		expect(storeMocks.deleteCategory).toHaveBeenCalledWith('list-1', 'category-2');
	});
});

describe('CategoryConfigDialog layout and accessibility', () => {
	it('reserves the same color-control space for colored and colorless categories', () => {
		const { container } = render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		const produceColor = screen.getByTestId('category-color-control-category-1');
		const dairyColor = screen.getByTestId('category-color-control-category-2');
		expect(produceColor).toHaveClass('h-8', 'w-8', 'flex-shrink-0');
		expect(dairyColor).toHaveClass('h-8', 'w-8', 'flex-shrink-0');
		expect(produceColor.compareDocumentPosition(screen.getByRole('button', { name: 'Edit category name Produce' }))).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(dairyColor.compareDocumentPosition(screen.getByRole('button', { name: 'Edit category name Dairy' }))).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(container.querySelector('[data-testid="category-color-control-category-1"] span')).not.toHaveClass('border');
		expect(container.querySelector('[data-testid="category-color-control-category-2"] span')).toHaveClass('border-dashed');
	});

	it('keeps narrow-layout controls accessible with stable target classes', async () => {
		render(CategoryConfigDialog, {
			props: {
				categories,
				listId: 'list-1',
				onclose: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
		expect(screen.getAllByLabelText('Drag to reorder category')).toHaveLength(2);
		expect(screen.getByRole('button', { name: 'Edit color for Produce' })).toHaveClass('h-8', 'w-8');
		expect(screen.getByRole('button', { name: 'Edit category name Produce' })).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
		expect(screen.getByRole('textbox', { name: 'New category color custom hex' })).toBeInTheDocument();
		expect(screen.getByPlaceholderText('New category name')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Edit color for Dairy' }));
		expect(screen.getByRole('textbox', { name: 'Color for Dairy custom hex' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Color for Dairy no color' })).toBeInTheDocument();
	});
});
