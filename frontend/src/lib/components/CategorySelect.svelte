<script lang="ts">
	import type { Category } from '$lib/mock-data';
	import Select from './Select.svelte';

	type Size = 'default' | 'compact' | 'dense' | 'display';
	type Appearance = 'default' | 'inline';

	interface Props {
		categories: Category[];
		selectedCategoryId?: string | null;
		disabled?: boolean;
		consumeOutsidePointer?: boolean;
		inlineOptions?: boolean;
		label?: string;
		ariaLabel?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		appearance?: Appearance;
		emptyLabel?: string;
		emptySelectedLabel?: string;
		onSelect?: (categoryId: string | null) => void;
		onCreate?: (name: string) => Promise<Category>;
	}

	let {
		categories = [],
		selectedCategoryId = $bindable(null),
		disabled = false,
		consumeOutsidePointer = true,
		inlineOptions = false,
		label = 'Category',
		ariaLabel = '',
		placeholder = 'Select a category',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		appearance = 'default',
		emptyLabel = 'Uncategorized',
		emptySelectedLabel = emptyLabel,
		onSelect,
		onCreate
	}: Props = $props();

	let createdCategories = $state<Category[]>([]);
	const availableCategories = $derived([...categories, ...createdCategories.filter(created => !categories.some(category => category.id === created.id))]);
	async function createCategory(name: string): Promise<string> {
		const category = await onCreate!(name);
		createdCategories = [...createdCategories.filter(existing => existing.id !== category.id), category];
		return category.id;
	}
	$effect(() => {
		const pending = createdCategories.filter(created => !categories.some(category => category.id === created.id));
		if (pending.length !== createdCategories.length) createdCategories = pending;
	});
	const uncategorizedValue = '';
	const categoryOptions = $derived([uncategorizedValue, ...availableCategories.map((category) => category.id)]);
	const selectValue = $derived(selectedCategoryId ?? uncategorizedValue);

	function findCategory(categoryId: string): Category | undefined {
		return availableCategories.find((category) => category.id === categoryId);
	}

	function getCategoryLabel(categoryId: string): string {
		if (!categoryId) return emptyLabel;
		return findCategory(categoryId)?.name ?? categoryId;
	}

	function getSelectedCategoryLabel(categoryId: string): string {
		if (!categoryId) return emptySelectedLabel;
		return getCategoryLabel(categoryId);
	}

	function isSelectedCategoryMuted(categoryId: string): boolean {
		return !categoryId;
	}

	function getCategoryColor(categoryId: string): string | null {
		if (!categoryId) return null;
		return findCategory(categoryId)?.color ?? null;
	}

	function hasCategoryColor(categoryId: string): boolean {
		return Boolean(getCategoryColor(categoryId));
	}

	function handleSelect(categoryId: string) {
		const nextCategoryId = categoryId || null;
		selectedCategoryId = nextCategoryId;
		onSelect?.(nextCategoryId);
	}
</script>

{#snippet categorySwatch(categoryId: string)}
	<span
		data-testid={`category-select-swatch-${categoryId || 'uncategorized'}`}
		class="h-3 w-3 shrink-0 rounded-full {hasCategoryColor(categoryId) ? '' : 'border border-dashed border-muted'}"
		style={getCategoryColor(categoryId) ? `background-color: ${getCategoryColor(categoryId)}` : undefined}
		aria-hidden="true"
	></span>
{/snippet}

<Select
	options={categoryOptions}
	selected={selectValue}
	{inlineOptions}
	{consumeOutsidePointer}
	{disabled}
	{label}
	{ariaLabel}
	{placeholder}
	{labelId}
	id={id}
	listboxId={listboxId}
	class={className}
	{size}
	{appearance}
	getOptionLabel={getCategoryLabel}
	getSelectedLabel={getSelectedCategoryLabel}
	isSelectedMuted={isSelectedCategoryMuted}
	onSelect={handleSelect}
	onCreate={onCreate ? createCategory : undefined}
	canCreate={(name) => !availableCategories.some(category => category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())}
	createErrorMessage="Could not create category. Please try again."
>
	{#snippet selectedContent(categoryId)}
		{@render categorySwatch(categoryId)}
	{/snippet}

	{#snippet optionContent(categoryId)}
		<span class="inline-flex min-w-0 items-center gap-2">
			{@render categorySwatch(categoryId)}
			<span class="min-w-0 truncate">{getCategoryLabel(categoryId)}</span>
		</span>
	{/snippet}
</Select>
