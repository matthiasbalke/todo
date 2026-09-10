<script lang="ts">
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

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
		<button
			type="button"
			class="inline-flex h-6 items-center rounded-full border border-primary-soft bg-primary-surface px-2 text-xs text-primary-strong hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-primary focus-visible:ring-offset-1 control-focus"
			onclick={() => { sortOpen = !sortOpen; }}
			aria-label="Change sort order: {sortLabel} {sortDirectionLabel}"
			aria-haspopup="menu"
			aria-expanded={sortOpen}
		>
			Sort: {sortLabel}
			<Icon name={sortDirectionIcon} size="metadata" />
		</button>
		{#if sortOpen}
			<button
				type="button"
				class="fixed inset-0 z-10 cursor-default"
				aria-label="Close sort menu"
				onclick={() => { sortOpen = false; }}
			></button>
			<div class="absolute left-0 top-7 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
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
		<span
			class="inline-flex items-center overflow-hidden rounded-full border border-primary-soft bg-primary-surface text-xs text-primary-strong"
		>
			<span class="px-2 py-0.5">{filter.label}</span>
			<button
				type="button"
				class="flex h-6 w-6 items-center justify-center border-l border-primary-soft text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-primary focus-visible:ring-offset-1 control-focus"
				aria-label="Clear {filter.label} filter"
				onclick={filter.onreset}
			>
				<Icon name="close" size="metadata" />
			</button>
		</span>
	{/each}
</div>
