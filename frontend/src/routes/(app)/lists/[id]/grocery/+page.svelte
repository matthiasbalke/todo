<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, loadItemsForList } from '$lib/stores/items.svelte';
  import { getList, updateList, getCategoriesForList, loadCategoriesForList, isHideDone, setHideDone } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import type { Filters } from '$lib/utils';
  import { untrack } from 'svelte';
  import type { SortField, SortDirection } from '$lib/mock-data';
  import { loadListPrefs, saveListPrefs, deleteListPrefs } from '$lib/listPrefs';
  import { loadListCategoryState, saveListCategoryState, deleteListCategoryState } from '$lib/listCategoryState';
  import GroceryCategorySection from '$lib/components/GroceryCategorySection.svelte';
  import ListForm from '$lib/components/ListForm.svelte';
  import CategoryConfigDialog from '$lib/components/CategoryConfigDialog.svelte';
  import { friendlyError } from '$lib/api/errors';
  import Button from '$lib/components/Button.svelte';
  import { getListCapabilities } from '$lib/listCapabilities';

  let { data }: { data: PageData } = $props();

  const _savedCategoryState = untrack(() => loadListCategoryState(data.id));
  let collapsedSections = $state<Set<string | null>>(
    new Set(Object.entries(_savedCategoryState?.collapsed ?? {}).filter(([, v]) => v).map(([k]) => k === '__null__' ? null : k))
  );
  let menuOpen = $state(false);
  let sortSubmenuOpen = $state(false);
  let filterSubmenuOpen = $state(false);
  let showEditForm = $state(false);
  let showCategoryDialog = $state(false);

  const list = $derived(getList(data.id));
  const categories = $derived(getCategoriesForList(data.id));
  const capabilities = $derived(list ? getListCapabilities(list.role) : getListCapabilities('VIEWER'));

  $effect(() => { loadCategoriesForList(data.id); });
  $effect(() => { loadItemsForList(data.id); });

  const _savedPrefs = untrack(() => loadListPrefs(data.id));
  untrack(() => setHideDone(data.id, _savedPrefs?.hideDone ?? false));
  let filters = $state<Filters>({
    starredOnly: _savedPrefs?.starredOnly ?? false,
    hideFuture: _savedPrefs?.hideFuture ?? false,
    hideUndated: _savedPrefs?.hideUndated ?? false,
    assigneeFilter: _savedPrefs?.assigneeFilter ?? 'all',
  });
  let sortField = $state<SortField>(_savedPrefs?.sortField ?? untrack(() => list?.defaultSortField ?? 'MANUAL'));
  let sortDirection = $state<SortDirection>(_savedPrefs?.sortDirection ?? untrack(() => list?.defaultSortDirection ?? 'ASC'));

  $effect(() => {
    const prefs = { sortField, sortDirection, ...filters, hideDone: isHideDone(data.id) };
    const isDefault =
      prefs.sortField === (list?.defaultSortField ?? 'MANUAL') &&
      prefs.sortDirection === (list?.defaultSortDirection ?? 'ASC') &&
      !prefs.starredOnly && !prefs.hideFuture && !prefs.hideUndated && !prefs.hideDone;
    if (isDefault) deleteListPrefs(data.id); else saveListPrefs(data.id, prefs);
  });
  $effect(() => {
    if (collapsedSections.size === 0) {
      deleteListCategoryState(data.id);
    } else {
      const collapsed: Record<string, boolean> = {};
      for (const k of collapsedSections) collapsed[k ?? '__null__'] = true;
      saveListCategoryState(data.id, { collapsed, doneCollapsed: {} });
    }
  });

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

  const allItems = $derived(
    getItems()
      .filter(i => i.listId === data.id)
      .filter(i => !isHideDone(data.id) || !i.done)
  );
  const filtered = $derived(applyFilters(allItems, filters));
  const sorted = $derived(applySort(filtered, sortField, sortDirection));
  const grouped = $derived(groupByCategory(sorted, categories));

  async function handleEditList({ name, emoji }: { name: string; emoji: string }) {
    try {
      await updateList(data.id, { name, emoji });
      showEditForm = false;
    } catch (e) {
      alert(friendlyError(e, 'Failed to update list'));
    }
  }

  function toggleSection(key: string | null) {
    const next = new Set(collapsedSections);
    const strKey = key ?? '__null__';
    if (next.has(strKey)) {
      next.delete(strKey);
    } else {
      next.add(strKey);
    }
    collapsedSections = next;
  }
</script>

<div>
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists/{data.id}" class="text-gray-400 hover:text-gray-600">←</a>
    {#if showEditForm}
      <div class="flex-1">
        <ListForm
          {list}
          onsubmit={handleEditList}
          oncancel={() => { showEditForm = false; }}
        />
      </div>
    {:else}
      <h1 class="text-xl font-bold text-gray-900">{list?.emoji} {list?.name}</h1>
      <span class="text-sm text-gray-400">Grocery mode</span>
      <div class="relative ml-auto">
        <Button tone="neutral" appearance="bare"
          size="icon"
          emphasis="muted"
          onclick={() => { menuOpen = !menuOpen; sortSubmenuOpen = false; filterSubmenuOpen = false; }}
          aria-label="List options"
        >
          ⋮
        </Button>
        {#if menuOpen}
          <div
            class="fixed inset-0 z-10"
            onclick={() => { menuOpen = false; sortSubmenuOpen = false; filterSubmenuOpen = false; }}
            role="presentation"
          ></div>
          <div class="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <a
              href="/lists/{data.id}"
              onclick={() => { menuOpen = false; }}
              class="block w-full text-left px-4 py-2 text-sm font-normal text-gray-700 hover:bg-gray-50"
            >
              Standard mode
            </a>
            {#if capabilities.canEditList || capabilities.canManageCategories}
              <div class="border-t border-gray-100 mt-1 pt-1"></div>
            {/if}
            {#if capabilities.canEditList}
              <Button tone="neutral" appearance="bare"
                size="menu"
                align="start"
                weight="normal"
                onclick={() => { showEditForm = true; menuOpen = false; }}
              >
                Edit list
              </Button>
            {/if}
            {#if capabilities.canManageCategories}
              <Button tone="neutral" appearance="bare"
                size="menu"
                align="start"
                weight="normal"
                onclick={() => { showCategoryDialog = true; menuOpen = false; }}
              >
                Configure categories
              </Button>
            {/if}
            <div class="border-t border-gray-100 mt-1 pt-1">
              <Button tone="neutral" appearance="bare"
                size="menu"
                align="between"
                weight="normal"
                onclick={() => { filterSubmenuOpen = !filterSubmenuOpen; sortSubmenuOpen = false; }}
              >
                <span>Filter</span>
                <span class="text-gray-400 text-xs">{activeFilterCount > 0 ? `${activeFilterCount} active` : 'Off'}</span>
              </Button>
              {#if filterSubmenuOpen}
                <div class="bg-gray-50 border-t border-gray-100">
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Starred</p>
                  {#each [{ value: false, label: 'All items' }, { value: true, label: 'Starred only' }] as opt}
                    <Button tone="neutral" appearance="bare"
                      size="menu-indented"
                      align="between"
                      weight="normal"
                      selected={filters.starredOnly === opt.value}
                      onclick={() => { filters = { ...filters, starredOnly: opt.value }; }}
                    >
                      {opt.label}
                      {#if filters.starredOnly === opt.value}<span>✓</span>{/if}
                    </Button>
                  {/each}
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Due date</p>
                  {#each dueDateOptions as opt}
                    <Button tone="neutral" appearance="bare"
                      size="menu-indented"
                      align="between"
                      weight="normal"
                      selected={dueDateValue === opt.value}
                      onclick={() => { filters = { ...filters, hideFuture: opt.value === 'hideFuture', hideUndated: opt.value === 'hideUndated' }; }}
                    >
                      {opt.label}
                      {#if dueDateValue === opt.value}<span>✓</span>{/if}
                    </Button>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="border-t border-gray-100 mt-1 pt-1">
              <Button tone="neutral" appearance="bare"
                size="menu"
                align="between"
                weight="normal"
                onclick={() => { sortSubmenuOpen = !sortSubmenuOpen; filterSubmenuOpen = false; }}
              >
                <span>Sort</span>
                <span class="text-gray-400 text-xs">{sortFields.find(f => f.value === sortField)?.label} {sortDirection === 'ASC' ? '↑' : '↓'}</span>
              </Button>
              {#if sortSubmenuOpen}
                <div class="bg-gray-50 border-t border-gray-100">
                  {#each sortFields as f}
                    <Button tone="neutral" appearance="bare"
                      size="menu-indented"
                      align="between"
                      weight="normal"
                      selected={sortField === f.value}
                      onclick={() => { sortField = f.value; }}
                    >
                      {f.label}
                      {#if sortField === f.value}<span>✓</span>{/if}
                    </Button>
                  {/each}
                  <div class="border-t border-gray-200 mx-4 my-1"></div>
                  <Button tone="neutral" appearance="bare"
                    size="menu-indented"
                    align="start"
                    weight="normal"
                    onclick={() => { sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC'; }}
                  >
                    {sortDirection === 'ASC' ? '↑ Ascending' : '↓ Descending'}
                  </Button>
                </div>
              {/if}
            </div>
            <div class="border-t border-gray-100 mt-1 pt-1">
              <Button tone="neutral" appearance="bare"
                size="menu"
                align="between"
                weight="normal"
                selected={isHideDone(data.id)}
                onclick={() => { setHideDone(data.id, !isHideDone(data.id)); menuOpen = false; }}
              >
                <span>Hide checked</span>
                {#if isHideDone(data.id)}<span>✓</span>{/if}
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div>
    {#each [...grouped] as [key, { category, items }]}
      <GroceryCategorySection
        {category}
        {items}
        collapsed={collapsedSections.has(key ?? '__null__')}
        editable={capabilities.canEditItems}
        ontoggle={() => toggleSection(key)}
      />
    {/each}
  </div>

  {#if showCategoryDialog && capabilities.canManageCategories}
    <CategoryConfigDialog {categories} listId={data.id} onclose={() => { showCategoryDialog = false; }} />
  {/if}
</div>
