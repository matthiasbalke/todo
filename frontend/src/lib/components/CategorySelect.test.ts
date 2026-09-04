import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
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

	it('renders color dots and reserved spacing for real category options', async () => {
		render(CategorySelect, { props: { categories, label: 'Category' } });

		await fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));

		const groceries = screen.getByRole('option', { name: 'Groceries' });
		const groceriesSwatch = within(groceries).getByTestId('category-select-swatch-category-1');
		expect(groceriesSwatch).toHaveClass('h-3', 'w-3', 'rounded-full');
		expect(groceriesSwatch).toHaveStyle({ backgroundColor: 'rgb(96, 165, 250)' });

		const household = screen.getByRole('option', { name: 'Household' });
		const householdSwatch = within(household).getByTestId('category-select-swatch-category-2');
		expect(householdSwatch).toHaveClass('h-3', 'w-3');
		expect(householdSwatch).not.toHaveClass('rounded-full');
		expect(householdSwatch).not.toHaveAttribute('style');

		const uncategorizedSwatch = within(
			screen.getByRole('option', { name: 'Uncategorized' })
		).getByTestId('category-select-swatch-uncategorized');
		expect(uncategorizedSwatch).toHaveClass('h-3', 'w-3');
		expect(uncategorizedSwatch).not.toHaveClass('rounded-full');
		expect(uncategorizedSwatch).not.toHaveAttribute('style');
	});

	it('renders selected category color state in the trigger', async () => {
		const { rerender } = render(CategorySelect, {
			props: { categories, selectedCategoryId: 'category-1', label: 'Category' }
		});

		const coloredSwatch = screen.getByTestId('category-select-swatch-category-1');
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Groceries');
		expect(coloredSwatch).toHaveClass('rounded-full');
		expect(coloredSwatch).toHaveStyle({ backgroundColor: 'rgb(96, 165, 250)' });

		await rerender({ categories, selectedCategoryId: 'category-2', label: 'Category' });
		const colorlessSwatch = screen.getByTestId('category-select-swatch-category-2');
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Household');
		expect(colorlessSwatch).toHaveClass('h-3', 'w-3');
		expect(colorlessSwatch).not.toHaveClass('rounded-full');
		expect(colorlessSwatch).not.toHaveAttribute('style');

		await rerender({ categories, selectedCategoryId: null, label: 'Category' });
		expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Uncategorized');
		const uncategorizedSwatch = screen.getByTestId('category-select-swatch-uncategorized');
		expect(uncategorizedSwatch).toHaveClass('h-3', 'w-3');
		expect(uncategorizedSwatch).not.toHaveClass('rounded-full');
		expect(uncategorizedSwatch).not.toHaveAttribute('style');
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
