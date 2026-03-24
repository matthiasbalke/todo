<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, saveItem } from '$lib/stores/items.svelte';
  import { getList, saveList, getCategoriesForList } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import type { Filters } from '$lib/utils';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import SortSelector from '$lib/components/SortSelector.svelte';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import ListForm from '$lib/components/ListForm.svelte';
  import CategoryConfigDialog from '$lib/components/CategoryConfigDialog.svelte';

  let { data }: { data: PageData } = $props();

  const list = $derived(getList(data.id));
  const categories = $derived(getCategoriesForList(data.id));

  let filters = $state<Filters>({
    starredOnly: false,
    hideFuture: false,
    hideUndated: false
  });
  let sortField = $state<SortField>(list?.sortField ?? 'MANUAL');
  let sortDirection = $state<SortDirection>(list?.sortDirection ?? 'ASC');
  let showAddForm = $state(false);
  let showEditForm = $state(false);
  let showCategoryDialog = $state(false);

  const allItems = $derived(getItems().filter(i => i.listId === data.id));
  const filtered = $derived(applyFilters(allItems, filters));
  const sorted = $derived(applySort(filtered, sortField, sortDirection));
  const grouped = $derived(groupByCategory(sorted, categories));

  function handleAddItem(item: TodoItem) {
    saveItem(item);
  }
</script>

{#if !list}
  <div class="text-center py-12 text-gray-400">List not found.</div>
{:else}
<div>
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    {#if showEditForm}
      <div class="flex-1">
        <ListForm
          {list}
          onsubmit={(updated) => { saveList(updated); showEditForm = false; }}
          oncancel={() => { showEditForm = false; }}
        />
      </div>
    {:else}
      <h1 class="text-xl font-bold text-gray-900">{list.emoji} {list.name}</h1>
      <button
        onclick={() => { showEditForm = true; }}
        class="p-1 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Edit list"
      >
        ✏️
      </button>
      <button
        onclick={() => { showCategoryDialog = true; }}
        class="p-1 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Configure categories"
      >
        🏷️
      </button>
      {#if list.id === 'grocery'}
        <a href="/lists/{list.id}/grocery" class="ml-auto px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
          Grocery mode
        </a>
      {/if}
    {/if}
  </div>

  {#if !showEditForm}
    <div class="space-y-3 mb-4">
      <FilterBar filters={filters} onchange={(f) => { filters = f; }} />
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
          allCategories={categories}
        />
      {/each}
    </div>

    {#if showAddForm}
      <div class="mt-4">
        <ItemForm
          listId={data.id}
          {categories}
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
  {/if}

  {#if showCategoryDialog}
    <CategoryConfigDialog {categories} listId={data.id} onclose={() => { showCategoryDialog = false; }} />
  {/if}
</div>
{/if}
