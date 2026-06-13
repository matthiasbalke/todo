<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { getItems, loadItemsForList, createItem } from '$lib/stores/items.svelte';
  import { getList, updateList, deleteList, getCategoriesForList, loadCategoriesForList, isHideDone, setHideDone } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory } from '$lib/utils';
  import { extractEmoji } from '$lib/utils/emoji';
  import type { Filters } from '$lib/utils';
  import { untrack } from 'svelte';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
  import { loadListPrefs, saveListPrefs, deleteListPrefs } from '$lib/listPrefs';
  import { loadListCategoryState, saveListCategoryState, deleteListCategoryState } from '$lib/listCategoryState';
  import { loadListItemDefaults, saveListItemDefaults } from '$lib/listItemDefaults';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import CategoryConfigDialog from '$lib/components/CategoryConfigDialog.svelte';
  import MembersDialog from '$lib/components/MembersDialog.svelte';
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import { connectToList, disconnectFromList } from '$lib/stores/sse.svelte';
  import { getMembers } from '$lib/api/lists';
  import { getListCapabilities } from '$lib/listCapabilities';
  import { friendlyError } from '$lib/api/errors';
  import type { User } from '$lib/mock-data';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  let { data }: { data: PageData } = $props();

  const list = $derived(getList(data.id));
  const categories = $derived(getCategoriesForList(data.id));
  const capabilities = $derived(list ? getListCapabilities(list.role) : getListCapabilities('VIEWER'));

  $effect(() => { loadCategoriesForList(data.id); });
  $effect(() => { loadItemsForList(data.id); });
  $effect(() => {
    connectToList(data.id);
    return () => disconnectFromList();
  });

  const _savedPrefs = untrack(() => loadListPrefs(data.id));
  untrack(() => setHideDone(data.id, _savedPrefs?.hideDone ?? false));
  const _savedCategoryState = untrack(() => loadListCategoryState(data.id));
  const _savedItemDefaults = untrack(() => loadListItemDefaults(data.id));
  let lastCategoryId = $state<string | null>(_savedItemDefaults?.lastCategoryId ?? null);
  let collapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.collapsed ?? {});
  let doneCollapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.doneCollapsed ?? {});
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
      !prefs.starredOnly && !prefs.hideFuture && !prefs.hideUndated && !prefs.hideDone &&
      (prefs.assigneeFilter ?? 'all') === 'all';
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

  // Populate real members for assignment and member display.
  let members = $state<User[]>([]);
  $effect(() => {
    getMembers(data.id).then(ms => {
      members = ms.map(m => ({ id: m.userId, name: m.displayName || m.email, email: m.email }));
    }).catch(() => { /* ignore */ });
  });

  const isDraggable = $derived(sortField === 'MANUAL' && capabilities.canEditItems);

  const dueDateOptions = [
    { value: 'all', label: 'Any due date' },
    { value: 'hideFuture', label: 'Hide future' },
    { value: 'hideUndated', label: 'Has due date' }
  ] as const;

  const dueDateValue = $derived(
    filters.hideFuture ? 'hideFuture' : filters.hideUndated ? 'hideUndated' : 'all'
  );

  const activeFilterCount = $derived(
    (filters.starredOnly ? 1 : 0) +
    (filters.hideFuture || filters.hideUndated ? 1 : 0) +
    (filters.assigneeFilter !== 'all' ? 1 : 0)
  );

  const sortFields: { value: SortField; label: string }[] = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'DUE_DATE', label: 'Due Date' },
    { value: 'STARRED', label: 'Starred' },
    { value: 'CREATED', label: 'Created' }
  ];

  const allItems = $derived(getItems().filter(i => i.listId === data.id));
  const filtered = $derived(applyFilters(allItems, filters, getCurrentUser()?.id));
  const sorted = $derived(applySort(filtered, sortField, sortDirection));
  const grouped = $derived(groupByCategory(sorted, categories));

  async function handleAddItem(item: TodoItem) {
    lastCategoryId = item.categoryId ?? null;
    saveListItemDefaults(data.id, { lastCategoryId });
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
    const emoji = extractEmoji(trimmed);
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
<div class="pb-20">
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    {#if editingTitle}
      <TextInput
        bind:element={titleInput}
        bind:value={titleEditValue}
        onblur={saveTitleEdit}
        onkeydown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveTitleEdit(); }
          if (e.key === 'Escape') { editingTitle = false; }
        }}
        containerClass="flex-1 min-w-0"
        size="title"
        appearance="inline"
        class="w-full min-w-0"
      />
    {:else if capabilities.canEditList}
      <Button tone="neutral" appearance="bare"
        type="button"
        size="title"
        weight="bold"
        onclick={() => { titleEditValue = `${list.emoji ?? '📋'} ${list.name}`; editingTitle = true; }}
      >
        {list.emoji ?? '📋'} {list.name}
      </Button>
    {:else}
      <h1 class="flex-1 min-w-0 text-xl font-bold text-gray-900">
        {list.emoji ?? '📋'} {list.name}
      </h1>
    {/if}
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
            <Button tone="neutral" appearance="bare"
              size="menu"
              align="start"
              weight="normal"
              onclick={() => { menuOpen = false; goto(`/lists/${list.id}/grocery`); }}
            >
              Grocery mode
            </Button>
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
            <Button tone="neutral" appearance="bare"
              size="menu"
              align="start"
              weight="normal"
              onclick={() => { showMembersDialog = true; menuOpen = false; }}
            >
              Members
            </Button>
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
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Assigned</p>
                  {#each [
                    { value: 'all',    label: 'All items' },
                    { value: 'none',   label: 'Not assigned' },
                    { value: 'me',     label: 'Assigned to me' },
                    { value: 'others', label: 'Assigned to others' },
                  ] as opt}
                    <Button tone="neutral" appearance="bare"
                      size="menu-indented"
                      align="between"
                      weight="normal"
                      selected={filters.assigneeFilter === opt.value}
                      onclick={() => { filters = { ...filters, assigneeFilter: opt.value as Filters['assigneeFilter'] }; }}
                    >
                      {opt.label}
                      {#if filters.assigneeFilter === opt.value}<span>✓</span>{/if}
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
                      {#if sortField === f.value}
                        <span>✓</span>
                      {/if}
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
            {#if capabilities.canEditList}
              <div class="border-t border-gray-100 mt-1 pt-1">
                <Button tone="danger" appearance="ghost"
                  size="menu"
                  align="start"
                  weight="normal"
                  onclick={() => { menuOpen = false; handleDelete(); }}
                  disabled={deleting}
                >
                  Delete list
                </Button>
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
        users={members}
        hideDone={isHideDone(data.id)}
        collapsed={collapsedMap[key ?? '__null__'] ?? false}
        doneCollapsed={doneCollapsedMap[key ?? '__null__'] ?? true}
        listId={data.id}
        editable={capabilities.canEditItems}
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

  {#if showCategoryDialog && capabilities.canManageCategories}
    <CategoryConfigDialog {categories} listId={data.id} onclose={() => { showCategoryDialog = false; }} />
  {/if}

  {#if showMembersDialog}
    <MembersDialog
      listId={data.id}
      canManageMembers={capabilities.canManageMembers}
      onclose={() => { showMembersDialog = false; }}
    />
  {/if}
</div>

{#if capabilities.canEditItems}
  <div class="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg">
    <div class="max-w-2xl mx-auto px-4 py-3">
      {#if showAddForm}
        <div class="max-h-[70vh] overflow-y-auto">
          <ItemForm
            listId={data.id}
            {categories}
            users={members}
            onsubmit={handleAddItem}
            oncancel={() => { showAddForm = false; }}
            defaultCategoryId={lastCategoryId ?? undefined}
          />
        </div>
      {:else}
        <Button tone="neutral" appearance="outline"
          size="empty"
          onclick={() => { showAddForm = true; }}
          class="w-full"
        >
          + Add item
        </Button>
      {/if}
    </div>
  </div>
{/if}
{/if}
