import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Category } from '$lib/mock-data';
import CategorySelect from './CategorySelect.svelte';

afterEach(cleanup);

const categories: Category[] = [
	{ id: 'category-1', listId: 'list-1', name: 'Groceries', color: '#60a5fa', sortOrder: 1 },
	{ id: 'category-2', listId: 'list-1', name: 'Household', color: null, sortOrder: 2 },
	{ id: 'category-3', listId: 'list-1', name: 'Errands', color: '#22c55e', sortOrder: 3 }
];

describe('CategorySelect', () => {
	it('renders Uncategorized first and real categories by name', async () => {
		render(CategorySelect, { props: { categories, label: 'Category' } });

		const trigger = screen.getByRole('combobox', { name: 'Category' });
		expect(trigger).toHaveValue('Uncategorized');

		await fireEvent.click(trigger);
		expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
			'Uncategorized',
			'Groceries',
			'Household',
			'Errands'
		]);
	});

	it('can show a different closed label for Uncategorized while preserving the option label', async () => {
		render(CategorySelect, {
			props: { categories, label: '', ariaLabel: 'Category', emptySelectedLabel: 'assign category' }
		});

		const trigger = screen.getByRole('combobox', { name: 'Category' });
		expect(trigger).toHaveValue('assign category');
		expect(trigger).toHaveClass('typography-placeholder');
		expect(screen.getByTestId('category-select-swatch-uncategorized')).toHaveClass('rounded-full', 'border-dashed');

		await fireEvent.click(trigger);
		expect(screen.getByRole('option', { name: 'Uncategorized' })).toBeInTheDocument();
	});

	it('renders color dots and reserved spacing for real category options', async () => {
		render(CategorySelect, { props: { categories, label: 'Category' } });

		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));

		const groceries = screen.getByRole('option', { name: 'Groceries' });
		const groceriesSwatch = within(groceries).getByTestId('category-select-swatch-category-1');
		expect(groceriesSwatch).toHaveClass('h-3', 'w-3', 'rounded-full');
		expect(groceriesSwatch).toHaveStyle({ backgroundColor: 'rgb(96, 165, 250)' });

		const household = screen.getByRole('option', { name: 'Household' });
		const householdSwatch = within(household).getByTestId('category-select-swatch-category-2');
		expect(householdSwatch).toHaveClass('h-3', 'w-3', 'rounded-full', 'border-dashed');
		expect(householdSwatch).not.toHaveAttribute('style');

		const uncategorizedSwatch = within(
			screen.getByRole('option', { name: 'Uncategorized' })
		).getByTestId('category-select-swatch-uncategorized');
		expect(uncategorizedSwatch).toHaveClass('h-3', 'w-3', 'rounded-full', 'border-dashed');
		expect(uncategorizedSwatch).not.toHaveAttribute('style');
	});

	it('renders selected category color state in the trigger', async () => {
		const { rerender } = render(CategorySelect, {
			props: { categories, selectedCategoryId: 'category-1', label: 'Category' }
		});

		const coloredSwatch = screen.getByTestId('category-select-swatch-category-1');
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Groceries');
		expect(screen.getByRole('combobox', { name: 'Category' })).not.toHaveClass('typography-placeholder');
		expect(coloredSwatch).toHaveClass('rounded-full');
		expect(coloredSwatch).toHaveStyle({ backgroundColor: 'rgb(96, 165, 250)' });

		await rerender({ categories, selectedCategoryId: 'category-2', label: 'Category' });
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Household');
		expect(screen.getByTestId('category-select-swatch-category-2')).toHaveClass('rounded-full', 'border-dashed');

		await rerender({ categories, selectedCategoryId: null, label: 'Category' });
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Uncategorized');
		expect(screen.getByTestId('category-select-swatch-uncategorized')).toHaveClass('rounded-full', 'border-dashed');
	});

	it('emits category IDs and null for Uncategorized', async () => {
		const onSelect = vi.fn();
		render(CategorySelect, {
			props: { categories, selectedCategoryId: 'category-1', label: 'Category', onSelect }
		});

		const trigger = screen.getByRole('combobox', { name: 'Category' });
		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('option', { name: 'Household' }));
		expect(onSelect).toHaveBeenLastCalledWith('category-2');

		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('option', { name: 'Uncategorized' }));
		expect(onSelect).toHaveBeenLastCalledWith(null);
	});

	it('keeps duplicate names distinct and searchable by label', async () => {
		const onSelect = vi.fn();
		const duplicateCategories: Category[] = [
			{ id: 'first-id', listId: 'list-1', name: 'Duplicate', color: '#60a5fa', sortOrder: 1 },
			{ id: 'second-id', listId: 'list-1', name: 'Duplicate', color: null, sortOrder: 2 }
		];
		render(CategorySelect, {
			props: { categories: duplicateCategories, label: 'Category', onSelect }
		});

		const trigger = screen.getByRole('combobox', { name: 'Category' });
		await fireEvent.input(trigger, { target: { value: 'dupl' } });
		const options = screen.getAllByRole('option', { name: 'Duplicate' });
		expect(options).toHaveLength(2);

		await fireEvent.click(options[1]);
		expect(onSelect).toHaveBeenCalledWith('second-id');
	});

	it('forwards disabled state to the shared Select trigger', () => {
		render(CategorySelect, { props: { categories, label: 'Category', disabled: true } });

		expect(screen.getByRole('combobox', { name: 'Category' })).toBeDisabled();
	});
});

describe('CategorySelect creation', () => {
	const created = { id: 'server-id', listId: 'list-1', name: 'Garden', color: null, sortOrder: 4 };

	it.each(['Enter', 'pointer'])('creates and selects the persisted ID using %s', async (activation) => {
		const onCreate = vi.fn().mockResolvedValue(created);
		const onSelect = vi.fn();
		render(CategorySelect, { categories, onCreate, onSelect });
		const input = screen.getByRole('combobox', { name: 'Category' });
		await fireEvent.input(input, { target: { value: '  Garden  ' } });
		if (activation === 'Enter') await fireEvent.keyDown(input, { key: 'Enter' });
		else await fireEvent.click(screen.getByRole('option', { name: '+ Create Garden' }));
		await waitFor(() => expect(input).toHaveValue('Garden'));
		expect(onCreate).toHaveBeenCalledExactlyOnceWith('Garden');
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('server-id');
		await fireEvent.click(input);
		expect(screen.getByRole('option', { name: 'Garden' })).toBeInTheDocument();
	});

	it.each(['', '  ', ' groceries ', 'HOUSEHOLD'])('suppresses creation for %j', async (value) => {
		render(CategorySelect, { categories, onCreate: vi.fn() });
		await fireEvent.input(screen.getByRole('combobox'), { target: { value } });
		expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();
	});

	it('does not offer creation without the callback', async () => {
		render(CategorySelect, { categories });
		await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'Garden' } });
		expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();
	});

	it('lists partial matches first and supports keyboard navigation to creation', async () => {
		const onCreate = vi.fn().mockResolvedValue({ ...created, name: 'Gro' });
		render(CategorySelect, { categories, onCreate });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Gro' } });
		expect(screen.getAllByRole('option').map(option => option.textContent?.trim())).toEqual(['Groceries', '+ Create Gro']);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'Enter' });
		await waitFor(() => expect(input).toHaveValue('Gro'));
		expect(onCreate).toHaveBeenCalledExactlyOnceWith('Gro');
	});

	it('preserves the prior assignment on rejection and retains the name for retry', async () => {
		const onCreate = vi.fn().mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValue(created);
		const onSelect = vi.fn();
		render(CategorySelect, { categories, selectedCategoryId: 'category-1', onCreate, onSelect });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Garden' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not create category'));
		expect(input).toHaveValue('Garden');
		expect(onSelect).not.toHaveBeenCalled();
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(input).toHaveValue('Groceries');
		await fireEvent.input(input, { target: { value: 'Garden' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		await waitFor(() => expect(input).toHaveValue('Garden'));
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('server-id');
	});

	it('prevents repeated activation and conflicting selection while pending', async () => {
		let resolve!: (category: Category) => void;
		const onCreate = vi.fn(() => new Promise<Category>(res => { resolve = res; }));
		const onSelect = vi.fn();
		render(CategorySelect, { categories, onCreate, onSelect });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Garden' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('status')).toHaveTextContent('Creating Garden');
		await fireEvent.keyDown(input, { key: 'Enter' });
		await fireEvent.click(screen.getByRole('option', { name: '+ Create Garden' }));
		expect(onCreate).toHaveBeenCalledTimes(1);
		expect(onSelect).not.toHaveBeenCalled();
		resolve(created);
		await waitFor(() => expect(onSelect).toHaveBeenCalledExactlyOnceWith('server-id'));
	});

	it.each(['dismiss', 'unmount'])('does not select after %s during creation', async (action) => {
		let resolve!: (category: Category) => void;
		const onCreate = vi.fn(() => new Promise<Category>(res => { resolve = res; }));
		const onSelect = vi.fn();
		const { unmount } = render(CategorySelect, { categories, onCreate, onSelect });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Garden' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		if (action === 'dismiss') await fireEvent.keyDown(input, { key: 'Escape' });
		else unmount();
		resolve(created);
		await new Promise(res => setTimeout(res, 0));
		expect(onSelect).not.toHaveBeenCalled();
	});
});


describe('CategorySelect created category synchronization', () => {
	it('does not keep a deleted category after the parent has accepted it', async () => {
		const created = { id: 'server-id', listId: 'list-1', name: 'Garden', color: null, sortOrder: 4 };
		const { rerender } = render(CategorySelect, { categories, onCreate: vi.fn().mockResolvedValue(created) });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Garden' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		await waitFor(() => expect(input).toHaveValue('Garden'));
		await rerender({ categories: [...categories, created] });
		await rerender({ categories, selectedCategoryId: null });
		await fireEvent.click(input);
		expect(screen.queryByRole('option', { name: 'Garden' })).not.toBeInTheDocument();
	});
});
