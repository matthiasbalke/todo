<script lang="ts">
	import Button from './Button.svelte';

	export interface FilterChip {
		id: string;
		label: string;
		onreset: () => void;
	}

	export interface SortOption {
		value: string;
		label: string;
	}

	type SortDirection = 'ASC' | 'DESC';

	let {
		filters = [],
		sortLabel,
		sortOptions,
		sortField,
		sortDirection,
		visibleCount,
		onSortFieldChange,
		onSortDirectionChange
	}: {
		filters?: FilterChip[];
		sortLabel: string;
		sortOptions: SortOption[];
		sortField: string;
		sortDirection: SortDirection;
		visibleCount?: number;
		onSortFieldChange: (value: string) => void;
		onSortDirectionChange: (value: SortDirection) => void;
	} = $props();

	let sortOpen = $state(false);
</script>

<div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
	{#if visibleCount !== undefined}
		<span>{visibleCount} {visibleCount === 1 ? 'item' : 'items'}</span>
	{/if}
	<span class="relative inline-flex">
		<button
			type="button"
			class="inline-flex h-6 items-center rounded-full border border-blue-200 bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
			onclick={() => { sortOpen = !sortOpen; }}
			aria-label="Change sort order: {sortLabel}"
			aria-haspopup="menu"
			aria-expanded={sortOpen}
		>
			Sort: {sortLabel}
		</button>
		{#if sortOpen}
			<button
				type="button"
				class="fixed inset-0 z-10 cursor-default"
				aria-label="Close sort menu"
				onclick={() => { sortOpen = false; }}
			></button>
			<div class="absolute left-0 top-7 z-20 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
				<p class="px-4 py-1 text-xs font-medium uppercase text-gray-400">Sort by</p>
				{#each sortOptions as option (option.value)}
					<Button
						tone="neutral"
						appearance="bare"
						size="menu"
						align="between"
						weight="normal"
						selected={sortField === option.value}
						onclick={() => { onSortFieldChange(option.value); }}
					>
						{option.label}
						{#if sortField === option.value}
							<span>✓</span>
						{/if}
					</Button>
				{/each}
				<div class="mx-4 my-1 border-t border-gray-200"></div>
				<Button
					tone="neutral"
					appearance="bare"
					size="menu"
					align="start"
					weight="normal"
					onclick={() => { onSortDirectionChange(sortDirection === 'ASC' ? 'DESC' : 'ASC'); }}
				>
					{sortDirection === 'ASC' ? '↑ Ascending' : '↓ Descending'}
				</Button>
			</div>
		{/if}
	</span>
	{#each filters as filter (filter.id)}
		<span
			class="inline-flex items-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 text-xs text-blue-700"
		>
			<span class="px-2 py-0.5">{filter.label}</span>
			<button
				type="button"
				class="flex h-6 w-6 items-center justify-center border-l border-blue-200 text-blue-600 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
				aria-label="Clear {filter.label} filter"
				onclick={filter.onreset}
			>
				x
			</button>
		</span>
	{/each}
</div>
