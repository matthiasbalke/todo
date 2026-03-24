<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, saveItem } from '$lib/stores/items.svelte';
  import { getList, saveList, getCategoriesForList } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import type { Filters } from '$lib/utils';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
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
  let menuOpen = $state(false);
  let sortSubmenuOpen = $state(false);
  let filterSubmenuOpen = $state(false);

  const dueDateOptions = [
    { value: 'all', label: 'Any due date' },
    { value: 'hideFuture', label: 'Hide future' },
    { value: 'hideUndated', label: 'Has due date' }
  ] as const;

  const dueDateValue = $derived(
    filters.hideFuture ? 'hideFuture' : filters.hideUndated ? 'hideUndated' : 'all'
  );

  const activeFilterCount = $derived(
    (filters.starredOnly ? 1 : 0) + (filters.hideFuture || filters.hideUndated ? 1 : 0)
  );

  const sortFields: { value: SortField; label: string }[] = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'DUE_DATE', label: 'Due Date' },
    { value: 'STARRED', label: 'Starred' },
    { value: 'CREATED', label: 'Created' }
  ];

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
      {#if list.id === 'grocery'}
        <a href="/lists/{list.id}/grocery" class="ml-auto px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
          Grocery mode
        </a>
      {/if}
      <div class="relative {list.id === 'grocery' ? '' : 'ml-auto'}">
        <button
          onclick={() => { menuOpen = !menuOpen; sortSubmenuOpen = false; filterSubmenuOpen = false; }}
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="List options"
        >
          ⋮
        </button>
        {#if menuOpen}
          <div
            class="fixed inset-0 z-10"
            onclick={() => { menuOpen = false; sortSubmenuOpen = false; filterSubmenuOpen = false; }}
            role="presentation"
          ></div>
          <div class="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <button
              onclick={() => { showEditForm = true; menuOpen = false; }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit list
            </button>
            <button
              onclick={() => { showCategoryDialog = true; menuOpen = false; }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Configure categories
            </button>
            <div class="border-t border-gray-100 mt-1 pt-1">
              <button
                onclick={() => { filterSubmenuOpen = !filterSubmenuOpen; sortSubmenuOpen = false; }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Filter</span>
                <span class="text-gray-400 text-xs">{activeFilterCount > 0 ? `${activeFilterCount} active` : 'Off'}</span>
              </button>
              {#if filterSubmenuOpen}
                <div class="bg-gray-50 border-t border-gray-100">
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Starred</p>
                  {#each [{ value: false, label: 'All items' }, { value: true, label: 'Starred only' }] as opt}
                    <button
                      onclick={() => { filters = { ...filters, starredOnly: opt.value }; }}
                      class="w-full text-left px-6 py-1.5 text-sm flex items-center justify-between {filters.starredOnly === opt.value ? 'text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}"
                    >
                      {opt.label}
                      {#if filters.starredOnly === opt.value}<span>✓</span>{/if}
                    </button>
                  {/each}
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Due date</p>
                  {#each dueDateOptions as opt}
                    <button
                      onclick={() => { filters = { ...filters, hideFuture: opt.value === 'hideFuture', hideUndated: opt.value === 'hideUndated' }; }}
                      class="w-full text-left px-6 py-1.5 text-sm flex items-center justify-between {dueDateValue === opt.value ? 'text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}"
                    >
                      {opt.label}
                      {#if dueDateValue === opt.value}<span>✓</span>{/if}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="border-t border-gray-100 mt-1 pt-1">
              <button
                onclick={() => { sortSubmenuOpen = !sortSubmenuOpen; filterSubmenuOpen = false; }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Sort</span>
                <span class="text-gray-400 text-xs">{sortFields.find(f => f.value === sortField)?.label} {sortDirection === 'ASC' ? '↑' : '↓'}</span>
              </button>
              {#if sortSubmenuOpen}
                <div class="bg-gray-50 border-t border-gray-100">
                  {#each sortFields as f}
                    <button
                      onclick={() => { sortField = f.value; }}
                      class="w-full text-left px-6 py-1.5 text-sm flex items-center justify-between {sortField === f.value ? 'text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}"
                    >
                      {f.label}
                      {#if sortField === f.value}
                        <span>✓</span>
                      {/if}
                    </button>
                  {/each}
                  <div class="border-t border-gray-200 mx-4 my-1"></div>
                  <button
                    onclick={() => { sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC'; }}
                    class="w-full text-left px-6 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    {sortDirection === 'ASC' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if !showEditForm}
    <div class="flex justify-end mb-4">
      <span class="text-sm text-gray-400">{filtered.length} items</span>
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
