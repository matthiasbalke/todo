<script lang="ts">
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import RemovableChip from './RemovableChip.svelte';

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
	const sortDirectionLabel = $derived(sortDirection === 'ASC' ? 'ascending' : 'descending');
	const sortDirectionText = $derived(sortDirection === 'ASC' ? 'Ascending' : 'Descending');
	const sortDirectionIcon = $derived(sortDirection === 'ASC' ? 'sortAscending' : 'sortDescending');
</script>

<div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
	{#if visibleCount !== undefined}
		<span>{visibleCount} {visibleCount === 1 ? 'item' : 'items'}</span>
	{/if}
	<span class="relative inline-flex">
		<RemovableChip
			onclick={() => { sortOpen = !sortOpen; }}
			aria-label="Change sort order: {sortLabel} {sortDirectionLabel}"
			aria-haspopup="menu"
			aria-expanded={sortOpen}
		>
			Sort: {sortLabel}
			<Icon name={sortDirectionIcon} size="metadata" />
		</RemovableChip>
		{#if sortOpen}
			<button
				type="button"
				class="fixed inset-0 z-10 cursor-default"
				aria-label="Close sort menu"
				onclick={() => { sortOpen = false; }}
			></button>
			<div class="absolute left-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
				<p class="px-4 py-1 text-xs font-medium uppercase text-subdued">Sort by</p>
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
							<Icon name="check" size="metadata" />
						{/if}
					</Button>
				{/each}
				<div class="mx-4 my-1 border-t border-border"></div>
				<Button
					tone="neutral"
					appearance="bare"
					size="menu"
					align="start"
					weight="normal"
					onclick={() => { onSortDirectionChange(sortDirection === 'ASC' ? 'DESC' : 'ASC'); }}
				>
					<Icon name={sortDirectionIcon} size="metadata" />
					{sortDirectionText}
				</Button>
			</div>
		{/if}
	</span>
	{#each filters as filter (filter.id)}
		<RemovableChip
			removeLabel="Clear {filter.label} filter"
			onremove={filter.onreset}
		>
			<span class="px-2 py-0.5">{filter.label}</span>
		</RemovableChip>
	{/each}
</div>
