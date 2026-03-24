<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, saveItem } from '$lib/stores/items.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import type { Filters } from '$lib/utils';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import SortSelector from '$lib/components/SortSelector.svelte';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';

  let { data }: { data: PageData } = $props();

  let filters = $state<Filters>({
    starredOnly: false,
    hideFuture: false,
    hideUndated: false,
    categoryId: null
  });
  let sortField = $state<SortField>(data.list.sortField);
  let sortDirection = $state<SortDirection>(data.list.sortDirection);
  let showAddForm = $state(false);

  const allItems = $derived(getItems().filter(i => i.listId === data.list.id));
  const filtered = $derived(applyFilters(allItems, filters));
  const sorted = $derived(applySort(filtered, sortField, sortDirection));
  const grouped = $derived(groupByCategory(sorted, data.categories));

  function handleAddItem(item: TodoItem) {
    saveItem(item);
    showAddForm = false;
  }
</script>

<div>
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    <h1 class="text-xl font-bold text-gray-900">{data.list.emoji} {data.list.name}</h1>
    {#if data.list.id === 'grocery'}
      <a href="/lists/{data.list.id}/grocery" class="ml-auto px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
        Grocery mode
      </a>
    {/if}
  </div>

  <div class="space-y-3 mb-4">
    <FilterBar filters={filters} categories={data.categories} onchange={(f) => { filters = f; }} />
    <div class="flex items-center justify-between">
      <SortSelector
        value={sortField}
        direction={sortDirection}
        onchange={(f, d) => { sortField = f; sortDirection = d; }}
      />
      <span class="text-sm text-gray-400">{filtered.length} items</span>
    </div>
  </div>

  <div class="space-y-1">
    {#each [...grouped] as [key, { category, items }]}
      <CategoryGroup
        categoryId={key}
        {category}
        {items}
        allCategories={data.categories}
      />
    {/each}
  </div>

  {#if showAddForm}
    <div class="mt-4">
      <ItemForm
        listId={data.list.id}
        categories={data.categories}
        users={data.users}
        onsubmit={handleAddItem}
        oncancel={() => { showAddForm = false; }}
      />
    </div>
  {:else}
    <button
      onclick={() => { showAddForm = true; }}
      class="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
    >
      + Add item
    </button>
  {/if}
</div>
