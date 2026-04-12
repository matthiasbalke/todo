<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { getItems, loadItemsForList, createItem } from '$lib/stores/items.svelte';
  import { getList, updateList, deleteList, getCategoriesForList, loadCategoriesForList, isHideDone, setHideDone } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import type { Filters } from '$lib/utils';
  import { untrack } from 'svelte';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
  import { loadListPrefs, saveListPrefs, deleteListPrefs } from '$lib/listPrefs';
  import { loadListCategoryState, saveListCategoryState, deleteListCategoryState } from '$lib/listCategoryState';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import CategoryConfigDialog from '$lib/components/CategoryConfigDialog.svelte';
  import MembersDialog from '$lib/components/MembersDialog.svelte';
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import { connectToList, disconnectFromList } from '$lib/stores/sse.svelte';
  import { getMembers } from '$lib/api/lists';
  import { friendlyError } from '$lib/api/errors';

  let { data }: { data: PageData } = $props();

  const list = $derived(getList(data.id));
  const categories = $derived(getCategoriesForList(data.id));

  $effect(() => { loadCategoriesForList(data.id); });
  $effect(() => { loadItemsForList(data.id); });
  $effect(() => {
    connectToList(data.id);
    return () => disconnectFromList();
  });

  const _savedPrefs = untrack(() => loadListPrefs(data.id));
  untrack(() => setHideDone(data.id, _savedPrefs?.hideDone ?? false));
  const _savedCategoryState = untrack(() => loadListCategoryState(data.id));
  let collapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.collapsed ?? {});
  let doneCollapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.doneCollapsed ?? {});
  let filters = $state<Filters>({
    starredOnly: _savedPrefs?.starredOnly ?? false,
    hideFuture: _savedPrefs?.hideFuture ?? false,
    hideUndated: _savedPrefs?.hideUndated ?? false
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
    const isEmpty = Object.keys(collapsedMap).length === 0 && Object.keys(doneCollapsedMap).length === 0;
    if (isEmpty) deleteListCategoryState(data.id);
    else saveListCategoryState(data.id, { collapsed: collapsedMap, doneCollapsed: doneCollapsedMap });
  });
  let showAddForm = $state(false);
  let editingTitle = $state(false);
  let titleEditValue = $state('');
  let showCategoryDialog = $state(false);
  let showMembersDialog = $state(false);
  let menuOpen = $state(false);
  let sortSubmenuOpen = $state(false);
  let filterSubmenuOpen = $state(false);
  let deleting = $state(false);
  let titleInput = $state<HTMLInputElement | null>(null);
  $effect(() => {
    if (editingTitle && titleInput) titleInput.focus();
  });

  // Determine current user's role in this list
  let myRole = $state<string | null>(null);
  $effect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    getMembers(data.id).then(members => {
      myRole = members.find(m => m.userId === currentUser.id)?.role ?? null;
    }).catch(() => { /* ignore */ });
  });

  const isOwner = $derived(myRole === 'OWNER');
  const isDraggable = $derived(sortField === 'MANUAL' && (myRole === 'EDITOR' || myRole === 'OWNER'));

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

  async function handleAddItem(item: TodoItem) {
    try {
      await createItem(data.id, {
        title: item.title,
        notes: item.notes,
        categoryId: item.categoryId,
        dueDate: item.dueDate,
        starred: item.starred,
        recurrenceRule: item.recurrenceRule,
        assignedUserIds: item.assignedUserIds,
        sortOrder: item.sortOrder,
      });
    } catch (e) {
      alert(friendlyError(e, 'Failed to add item'));
      throw e;
    }
  }

  async function saveTitleEdit() {
    editingTitle = false;
    const trimmed = titleEditValue.trim();
    const emojiMatch = trimmed.match(/^\p{Emoji_Presentation}/u);
    const emoji = emojiMatch ? emojiMatch[0] : '';
    const displayName = emoji ? trimmed.slice(emoji.length).trimStart() : trimmed;
    if (!displayName) return;
    try {
      await updateList(data.id, { name: displayName, emoji: emoji || '📋' });
    } catch (e) {
      alert(friendlyError(e, 'Failed to update list'));
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this list? This cannot be undone.')) return;
    deleting = true;
    try {
      await deleteList(data.id);
      goto('/lists');
    } catch (e) {
      alert(friendlyError(e, 'Failed to delete list'));
      deleting = false;
    }
  }
</script>

{#if !list}
  <div class="text-center py-12 text-gray-400">List not found.</div>
{:else}
<div>
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    {#if editingTitle}
      <input
        bind:this={titleInput}
        bind:value={titleEditValue}
        onblur={saveTitleEdit}
        onkeydown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveTitleEdit(); }
          if (e.key === 'Escape') { editingTitle = false; }
        }}
        class="flex-1 text-xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 min-w-0"
      />
    {:else}
      <button
        type="button"
        class="text-xl font-bold text-gray-900 cursor-pointer hover:opacity-70 transition-opacity text-left"
        onclick={() => { titleEditValue = `${list.emoji ?? '📋'} ${list.name}`; editingTitle = true; }}
      >
        {list.emoji ?? '📋'} {list.name}
      </button>
    {/if}
      <div class="relative ml-auto">
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
            <a
              href="/lists/{list.id}/grocery"
              onclick={() => { menuOpen = false; }}
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Grocery mode
            </a>
            <button
              onclick={() => { showCategoryDialog = true; menuOpen = false; }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Configure categories
            </button>
            <button
              onclick={() => { showMembersDialog = true; menuOpen = false; }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Members
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
            <div class="border-t border-gray-100 mt-1 pt-1">
              <button
                onclick={() => { setHideDone(data.id, !isHideDone(data.id)); menuOpen = false; }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Hide checked</span>
                {#if isHideDone(data.id)}<span>✓</span>{/if}
              </button>
            </div>
            {#if isOwner}
              <div class="border-t border-gray-100 mt-1 pt-1">
                <button
                  onclick={() => { menuOpen = false; handleDelete(); }}
                  disabled={deleting}
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete list
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
  </div>

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
        users={data.users}
        hideDone={isHideDone(data.id)}
        collapsed={collapsedMap[key ?? '__null__'] ?? false}
        doneCollapsed={doneCollapsedMap[key ?? '__null__'] ?? true}
        listId={data.id}
        {isDraggable}
        oncollapsedchange={(v) => {
          const next = { ...collapsedMap };
          if (v) next[key ?? '__null__'] = true; else delete next[key ?? '__null__'];
          collapsedMap = next;
        }}
        ondonecollapsedchange={(v) => {
          const next = { ...doneCollapsedMap };
          if (!v) next[key ?? '__null__'] = false; else delete next[key ?? '__null__'];
          doneCollapsedMap = next;
        }}
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

  {#if showCategoryDialog}
    <CategoryConfigDialog {categories} listId={data.id} onclose={() => { showCategoryDialog = false; }} />
  {/if}

  {#if showMembersDialog}
    <MembersDialog listId={data.id} onclose={() => { showMembersDialog = false; }} />
  {/if}
</div>
{/if}
