<script lang="ts">
	import type { Category } from '$lib/mock-data';
	import Select from './Select.svelte';

	interface Props {
		categories: Category[];
		selectedCategoryId?: string | null;
		disabled?: boolean;
		label?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		onSelect?: (categoryId: string | null) => void;
	}

	let {
		categories = [],
		selectedCategoryId = $bindable(null),
		disabled = false,
		label = 'Category',
		placeholder = 'Select a category',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		onSelect
	}: Props = $props();

	const uncategorizedValue = '';
	const categoryOptions = $derived([uncategorizedValue, ...categories.map((category) => category.id)]);
	const selectValue = $derived(selectedCategoryId ?? uncategorizedValue);

	function findCategory(categoryId: string): Category | undefined {
		return categories.find((category) => category.id === categoryId);
	}

	function getCategoryLabel(categoryId: string): string {
		if (!categoryId) return 'Uncategorized';
		return findCategory(categoryId)?.name ?? categoryId;
	}

	function getCategoryColor(categoryId: string): string | null {
		if (!categoryId) return null;
		return findCategory(categoryId)?.color ?? null;
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
		class="h-3 w-3 shrink-0 {getCategoryColor(categoryId) ? 'rounded-full' : ''}"
		style={getCategoryColor(categoryId) ? `background-color: ${getCategoryColor(categoryId)}` : undefined}
		aria-hidden="true"
	></span>
{/snippet}

<Select
	options={categoryOptions}
	selected={selectValue}
	{disabled}
	{label}
	{placeholder}
	{labelId}
	id={id}
	listboxId={listboxId}
	class={className}
	getOptionLabel={getCategoryLabel}
	onSelect={handleSelect}
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
