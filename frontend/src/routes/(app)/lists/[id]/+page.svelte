<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { getItems, loadItemsForList, createItem, deleteFinishedItems } from '$lib/stores/items.svelte';
  import { getList, updateList, deleteList, duplicateList, getCategoriesForList, loadCategoriesForList, isHideDone, setHideDone } from '$lib/stores/lists.svelte';
  import { applyFilters, applySort, groupByCategory, normalizeAssigneeFilters } from '$lib/utils';
  import { extractEmoji } from '$lib/utils/emoji';
  import type { AssigneeFilterCriterion, Filters } from '$lib/utils';
  import { untrack } from 'svelte';
  import type { SortField, SortDirection, TodoItem } from '$lib/mock-data';
  import { loadListPrefs, saveListPrefs, deleteListPrefs } from '$lib/listPrefs';
  import { loadListCategoryState, saveListCategoryState, deleteListCategoryState } from '$lib/listCategoryState';
  import { deleteListItemDefaults, loadListItemDefaults, saveListItemDefaults } from '$lib/listItemDefaults';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import type { ItemFormCancelContext, ItemFormDraft } from '$lib/components/ItemForm.svelte';
  import CategoryConfigDialog from '$lib/components/CategoryConfigDialog.svelte';
  import MembersDialog from '$lib/components/MembersDialog.svelte';
  import ListStateSummary from '$lib/components/ListStateSummary.svelte';
  import type { FilterChip } from '$lib/components/ListStateSummary.svelte';
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import { connectToList, disconnectFromList } from '$lib/stores/sse.svelte';
  import { getMembers } from '$lib/api/lists';
  import { getListCapabilities } from '$lib/listCapabilities';
  import { friendlyError } from '$lib/api/errors';
  import type { User } from '$lib/mock-data';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import DeleteCheckedItemsDialog from '$lib/components/DeleteCheckedItemsDialog.svelte';

  let { data }: { data: PageData } = $props();

  const list = $derived(getList(data.id));
  const categories = $derived(getCategoriesForList(data.id));
  const capabilities = $derived(list ? getListCapabilities(list.role) : getListCapabilities('VIEWER'));

  let categoriesLoaded = $state(false);
  $effect(() => {
    categoriesLoaded = false;
    Promise.resolve(loadCategoriesForList(data.id)).finally(() => {
      categoriesLoaded = true;
    });
  });
  $effect(() => { loadItemsForList(data.id); });
  $effect(() => {
    connectToList(data.id);
    return () => disconnectFromList();
  });

  const _savedPrefs = untrack(() => loadListPrefs(data.id));
  untrack(() => setHideDone(data.id, _savedPrefs?.hideDone ?? false));
  let hideDone = $state(untrack(() => isHideDone(data.id)));
  const _savedCategoryState = untrack(() => loadListCategoryState(data.id));
  const _savedItemDefaults = untrack(() => loadListItemDefaults(data.id));
  let lastCategoryId = $state<string | null>(_savedItemDefaults?.lastCategoryId ?? null);
  let collapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.collapsed ?? {});
  let doneCollapsedMap = $state<Record<string, boolean>>(_savedCategoryState?.doneCollapsed ?? {});
  let filters = $state<Filters>({
    starredOnly: _savedPrefs?.starredOnly ?? false,
    hideFuture: _savedPrefs?.hideFuture ?? false,
    hideUndated: _savedPrefs?.hideUndated ?? false,
    assigneeFilters: _savedPrefs?.assigneeFilters ?? [],
  });
  let sortField = $state<SortField>(_savedPrefs?.sortField ?? untrack(() => list?.defaultSortField ?? 'MANUAL'));
  let sortDirection = $state<SortDirection>(_savedPrefs?.sortDirection ?? untrack(() => list?.defaultSortDirection ?? 'ASC'));

  $effect(() => {
    const prefs = { sortField, sortDirection, ...filters, hideDone };
    const isDefault =
      prefs.sortField === (list?.defaultSortField ?? 'MANUAL') &&
      prefs.sortDirection === (list?.defaultSortDirection ?? 'ASC') &&
      !prefs.starredOnly && !prefs.hideFuture && !prefs.hideUndated && !prefs.hideDone &&
      prefs.assigneeFilters.length === 0;
    if (isDefault) deleteListPrefs(data.id); else saveListPrefs(data.id, prefs);
  });
  $effect(() => {
    const isEmpty = Object.keys(collapsedMap).length === 0 && Object.keys(doneCollapsedMap).length === 0;
    if (isEmpty) deleteListCategoryState(data.id);
    else saveListCategoryState(data.id, { collapsed: collapsedMap, doneCollapsed: doneCollapsedMap });
  });
  let showAddForm = $state(false);
  let addItemDraft = $state<ItemFormDraft | null>(null);
  let editingTitle = $state(false);
  let titleEditValue = $state('');
  let showCategoryDialog = $state(false);
  let showMembersDialog = $state(false);
  let menuOpen = $state(false);
  let sortSubmenuOpen = $state(false);
  let filterSubmenuOpen = $state(false);
  let deleting = $state(false);
  let duplicating = $state(false);
  let deletingFinished = $state(false);
  let showDeleteCheckedDialog = $state(false);
  let deleteCheckedError = $state('');
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

  const assigneeFilterOptions: { value: AssigneeFilterCriterion; label: string }[] = [
    { value: 'none', label: 'Not assigned' },
    { value: 'me', label: 'Assigned to me' },
    { value: 'others', label: 'Assigned to others' },
  ];

  const dueDateValue = $derived(
    filters.hideFuture ? 'hideFuture' : filters.hideUndated ? 'hideUndated' : 'all'
  );

  const activeFilterCount = $derived(
    (filters.starredOnly ? 1 : 0) +
    (filters.hideFuture || filters.hideUndated ? 1 : 0) +
    (filters.assigneeFilters.length > 0 ? 1 : 0) +
    (hideDone ? 1 : 0)
  );

  const sortFields: { value: SortField; label: string }[] = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'DUE_DATE', label: 'Due Date' },
    { value: 'STARRED', label: 'Starred' },
    { value: 'CREATED', label: 'Created' }
  ];

  const allItems = $derived(getItems().filter(i => i.listId === data.id));
  const checkedItemCount = $derived(allItems.filter((item) => item.done).length);
  const filtered = $derived(applyFilters(allItems, filters, getCurrentUser()?.id));
  const sorted = $derived(applySort(filtered, sortField, sortDirection));
  const grouped = $derived(groupByCategory(sorted, categories));
  const visibleItemCount = $derived(
    hideDone ? filtered.filter((item) => !item.done).length : filtered.length
  );
  const sortLabel = $derived(`${sortFields.find(f => f.value === sortField)?.label} ${sortDirection === 'ASC' ? '↑' : '↓'}`);
  const activeFilterChips = $derived.by((): FilterChip[] => {
    const chips: FilterChip[] = [];
    if (filters.starredOnly) {
      chips.push({ id: 'starred', label: 'Starred only', onreset: () => { filters = { ...filters, starredOnly: false }; } });
    }
    if (filters.hideFuture) {
      chips.push({ id: 'hideFuture', label: 'Hide future', onreset: () => { filters = { ...filters, hideFuture: false }; } });
    } else if (filters.hideUndated) {
      chips.push({ id: 'hideUndated', label: 'Has due date', onreset: () => { filters = { ...filters, hideUndated: false }; } });
    }
    if (filters.assigneeFilters.length > 0) {
      const assigneeLabels: Record<AssigneeFilterCriterion, string> = {
        none: 'Not assigned',
        me: 'Assigned to me',
        others: 'Assigned to others',
      };
      const labelOrder: AssigneeFilterCriterion[] = ['me', 'none', 'others'];
      const labels = labelOrder
        .filter((criterion) => filters.assigneeFilters.includes(criterion))
        .map((criterion) => assigneeLabels[criterion]);
      const displayLabel = labels
        .map((label, index) => index === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1))
        .join(' or ');
      chips.push({ id: 'assignee', label: displayLabel, onreset: () => { filters = { ...filters, assigneeFilters: [] }; } });
    }
    if (hideDone) {
      chips.push({ id: 'hideDone', label: 'Hide checked', onreset: () => { updateHideDone(false); } });
    }
    return chips;
  });
  const defaultCategoryId = $derived(
    categoriesLoaded && lastCategoryId && categories.some((category) => category.id === lastCategoryId)
      ? lastCategoryId
      : undefined
  );

  $effect(() => {
    if (!categoriesLoaded || !lastCategoryId) return;
    if (categories.some((category) => category.id === lastCategoryId)) return;
    lastCategoryId = null;
    deleteListItemDefaults(data.id);
  });

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
      lastCategoryId = item.categoryId ?? null;
      saveListItemDefaults(data.id, { lastCategoryId });
      addItemDraft = null;
    } catch (e) {
      alert(friendlyError(e, 'Failed to add item'));
      throw e;
    }
  }

  function handleAddItemCancel(context?: ItemFormCancelContext) {
    showAddForm = false;
    if (context?.reason === 'explicit') {
      addItemDraft = null;
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

  async function handleDuplicate() {
    duplicating = true;
    try {
      const duplicated = await duplicateList(data.id);
      goto(`/lists/${duplicated.id}`);
    } catch (e) {
      alert(friendlyError(e, 'Failed to duplicate list'));
      duplicating = false;
    }
  }

  function openDeleteCheckedDialog() {
    deleteCheckedError = '';
    showDeleteCheckedDialog = true;
    menuOpen = false;
    sortSubmenuOpen = false;
    filterSubmenuOpen = false;
  }

  function closeDeleteCheckedDialog() {
    if (deletingFinished) return;
    deleteCheckedError = '';
    showDeleteCheckedDialog = false;
  }

  async function handleDeleteCheckedItems() {
    deletingFinished = true;
    deleteCheckedError = '';
    try {
      await deleteFinishedItems(data.id);
      showDeleteCheckedDialog = false;
    } catch (e) {
      deleteCheckedError = friendlyError(e, 'Failed to delete checked items');
    } finally {
      deletingFinished = false;
    }
  }

  function updateHideDone(value: boolean) {
    hideDone = value;
    setHideDone(data.id, value);
  }

  function toggleAssigneeFilter(criterion: AssigneeFilterCriterion) {
    const selected = new Set(filters.assigneeFilters);
    if (selected.has(criterion)) selected.delete(criterion);
    else selected.add(criterion);
    filters = { ...filters, assigneeFilters: normalizeAssigneeFilters([...selected]) };
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
                  <Button tone="neutral" appearance="bare"
                    size="menu-indented"
                    align="between"
                    weight="normal"
                    selected={filters.assigneeFilters.length === 0}
                    onclick={() => { filters = { ...filters, assigneeFilters: [] }; }}
                  >
                    All items
                    {#if filters.assigneeFilters.length === 0}<span>✓</span>{/if}
                  </Button>
                  {#each assigneeFilterOptions as opt}
                    <Button tone="neutral" appearance="bare"
                      size="menu-indented"
                      align="between"
                      weight="normal"
                      selected={filters.assigneeFilters.includes(opt.value)}
                      onclick={() => { toggleAssigneeFilter(opt.value); }}
                    >
                      {opt.label}
                      {#if filters.assigneeFilters.includes(opt.value)}<span>✓</span>{/if}
                    </Button>
                  {/each}
                  <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Checked</p>
                  <Button tone="neutral" appearance="bare"
                    size="menu-indented"
                    align="between"
                    weight="normal"
                    selected={!hideDone}
                    onclick={() => { updateHideDone(false); }}
                  >
                    Show checked
                    {#if !hideDone}<span>✓</span>{/if}
                  </Button>
                  <Button tone="neutral" appearance="bare"
                    size="menu-indented"
                    align="between"
                    weight="normal"
                    selected={hideDone}
                    onclick={() => { updateHideDone(true); }}
                  >
                    Hide checked
                    {#if hideDone}<span>✓</span>{/if}
                  </Button>
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
            {#if capabilities.canEditItems}
              <div class="border-t border-gray-100 mt-1 pt-1">
                <Button tone="danger" appearance="ghost"
                  size="menu"
                  align="start"
                  weight="normal"
                  onclick={openDeleteCheckedDialog}
                  disabled={deletingFinished || checkedItemCount === 0}
                >
                  Delete checked items
                </Button>
              </div>
            {/if}
            {#if capabilities.canDuplicateList || capabilities.canEditList}
              <div class="border-t border-gray-100 mt-1 pt-1">
                {#if capabilities.canDuplicateList}
                  <Button tone="neutral" appearance="bare"
                    size="menu"
                    align="start"
                    weight="normal"
                    onclick={() => { menuOpen = false; handleDuplicate(); }}
                    disabled={duplicating}
                  >
                    Duplicate list
                  </Button>
                {/if}
                {#if capabilities.canEditList}
                  <Button tone="danger" appearance="ghost"
                    size="menu"
                    align="start"
                    weight="normal"
                    onclick={() => { menuOpen = false; handleDelete(); }}
                    disabled={deleting}
                  >
                    Delete list
                  </Button>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
  </div>

  <ListStateSummary
    filters={activeFilterChips}
    {sortLabel}
    sortOptions={sortFields}
    {sortField}
    {sortDirection}
    visibleCount={visibleItemCount}
    onSortFieldChange={(value) => { sortField = value as SortField; }}
    onSortDirectionChange={(value) => { sortDirection = value; }}
  />

  <div class="space-y-1">
    {#each [...grouped] as [key, { category, items }]}
      <CategoryGroup
        categoryId={key}
        {category}
        {items}
        allCategories={categories}
        users={members}
        {hideDone}
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

{#if showDeleteCheckedDialog}
  <DeleteCheckedItemsDialog
    count={checkedItemCount}
    deleting={deletingFinished}
    error={deleteCheckedError}
    onconfirm={handleDeleteCheckedItems}
    oncancel={closeDeleteCheckedDialog}
  />
{/if}

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
            oncancel={handleAddItemCancel}
            draft={addItemDraft}
            onDraftChange={(draft) => { addItemDraft = draft; }}
            {defaultCategoryId}
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
