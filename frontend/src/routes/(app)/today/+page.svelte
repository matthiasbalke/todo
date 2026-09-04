<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import CategoryGroup from '$lib/components/CategoryGroup.svelte';
  import Button from '$lib/components/Button.svelte';
  import ListStateSummary from '$lib/components/ListStateSummary.svelte';
  import type { FilterChip } from '$lib/components/ListStateSummary.svelte';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { getTodayEntries, isTodayLoading, loadToday, refreshToday, todayDtoToItem } from '$lib/stores/today.svelte';
  import { getListCapabilities } from '$lib/listCapabilities';
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import type { Category, SortDirection, SortField, TodoItem, User } from '$lib/mock-data';
  import { loadTodayPrefs, saveTodayPrefs } from '$lib/todayPrefs';

  const profile = $derived(getProfile());
  const entries = $derived(getTodayEntries());
  const userId = untrack(() => getCurrentUser()?.id ?? 'anonymous');
  const saved = untrack(() => loadTodayPrefs(userId));
  let sortField = $state<Exclude<SortField, 'MANUAL'>>(saved?.sortField ?? 'DUE_DATE');
  let sortDirection = $state<SortDirection>(saved?.sortDirection ?? 'ASC');
  let starredOnly = $state(saved?.starredOnly ?? false);
  let hideDone = $state(saved?.hideDone ?? false);
  let collapsed = $state<Record<string, boolean>>(saved?.collapsed ?? {});
  let doneCollapsed = $state<Record<string, boolean>>(saved?.doneCollapsed ?? {});
  let menuOpen = $state(false);
  let sortSubmenuOpen = $state(false);
  let filterSubmenuOpen = $state(false);

  $effect(() => {
    if (profile && !profile.todayViewEnabled) goto('/lists');
  });
  $effect(() => {
    saveTodayPrefs(userId, { sortField, sortDirection, starredOnly, hideDone, collapsed, doneCollapsed });
  });

  onMount(() => {
    loadToday();
    const refresh = () => {
      if (document.visibilityState === 'visible') refreshToday();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });

  const listGroups = $derived.by(() => {
    const byList = new Map<string, typeof entries>();
    for (const entry of entries) {
      if (starredOnly && !entry.starred) continue;
      const current = byList.get(entry.listId) ?? [];
      current.push(entry);
      byList.set(entry.listId, current);
    }
    return [...byList.entries()].map(([listId, listEntries]) => {
      const first = listEntries[0];
      const categories: Category[] = [...new Map(listEntries.filter(e => e.categoryId).map(e => [
        e.categoryId!,
        { id: e.categoryId!, listId, name: e.sourceCategoryName ?? 'Uncategorized', color: e.sourceCategoryColor, sortOrder: e.sourceCategoryOrder ?? 0 }
      ])).values()];
      const users: User[] = [...new Map(listEntries.flatMap(e => e.assignedUsers).map(user => [
        user.id, { id: user.id, name: user.displayName, email: '' }
      ])).values()];
      const byCategory = new Map<string | null, typeof listEntries>();
      for (const entry of listEntries) {
        const current = byCategory.get(entry.categoryId) ?? [];
        current.push(entry);
        byCategory.set(entry.categoryId, current);
      }
      const categoryGroups = [...byCategory.entries()]
        .map(([categoryId, categoryEntries]) => ({
          categoryId,
          category: categories.find(c => c.id === categoryId) ?? null,
          items: applyTodaySort(categoryEntries.map(todayDtoToItem)),
        }))
        .sort((a, b) => (a.category?.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.category?.sortOrder ?? Number.MAX_SAFE_INTEGER));
      return { listId, first, categories, users, categoryGroups };
    }).sort((a, b) =>
      (a.first.sourceListGroupOrder ?? Number.MAX_SAFE_INTEGER) - (b.first.sourceListGroupOrder ?? Number.MAX_SAFE_INTEGER) ||
      (a.first.sourceListOrder ?? Number.MAX_SAFE_INTEGER) - (b.first.sourceListOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.first.sourceListName.localeCompare(b.first.sourceListName)
    );
  });

  const sortFields: { value: Exclude<SortField, 'MANUAL'>; label: string }[] = [
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'DUE_DATE', label: 'Due date' },
    { value: 'STARRED', label: 'Starred' },
    { value: 'CREATED', label: 'Created' },
  ];
  const activeFilterCount = $derived((starredOnly ? 1 : 0) + (hideDone ? 1 : 0));
  const visibleItemCount = $derived(
    entries.filter((entry) => (!starredOnly || entry.starred) && (!hideDone || !entry.done)).length
  );
  const sortLabel = $derived(`${sortFields.find(field => field.value === sortField)?.label} ${sortDirection === 'ASC' ? '↑' : '↓'}`);
  const activeFilterChips = $derived.by((): FilterChip[] => {
    const chips: FilterChip[] = [];
    if (starredOnly) {
      chips.push({ id: 'starred', label: 'Starred only', onreset: () => { starredOnly = false; } });
    }
    if (hideDone) {
      chips.push({ id: 'hideDone', label: 'Hide checked', onreset: () => { hideDone = false; } });
    }
    return chips;
  });

  function compareTodayItems(a: TodoItem, b: TodoItem): number {
    let cmp = 0;
    switch (sortField) {
      case 'ALPHA':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'DUE_DATE': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db;
        break;
      }
      case 'STARRED':
        cmp = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        break;
      case 'CREATED':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    if (cmp !== 0) return sortDirection === 'DESC' ? -cmp : cmp;
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  }

  function applyTodaySort(items: TodoItem[]): TodoItem[] {
    return [...items].sort(compareTodayItems);
  }

</script>

<div class="space-y-5">
  <div class="flex items-center gap-3">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    <h1 class="text-xl font-bold text-gray-900">📆 Today</h1>
    <div class="relative ml-auto">
      <Button
        tone="neutral"
        appearance="bare"
        size="icon"
        emphasis="muted"
        onclick={() => {
          menuOpen = !menuOpen;
          sortSubmenuOpen = false;
          filterSubmenuOpen = false;
        }}
        aria-label="Today options"
      >
        ⋮
      </Button>
      {#if menuOpen}
        <div
          class="fixed inset-0 z-10"
          onclick={() => {
            menuOpen = false;
            sortSubmenuOpen = false;
            filterSubmenuOpen = false;
          }}
          role="presentation"
        ></div>
        <div class="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <div>
            <Button
              tone="neutral"
              appearance="bare"
              size="menu"
              align="between"
              weight="normal"
              onclick={() => {
                filterSubmenuOpen = !filterSubmenuOpen;
                sortSubmenuOpen = false;
              }}
            >
              <span>Filter</span>
              <span class="text-gray-400 text-xs">{activeFilterCount > 0 ? `${activeFilterCount} active` : 'Off'}</span>
            </Button>
            {#if filterSubmenuOpen}
              <div class="bg-gray-50 border-t border-gray-100">
                <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Starred</p>
                {#each [{ value: false, label: 'All items' }, { value: true, label: 'Starred only' }] as option}
                  <Button
                    tone="neutral"
                    appearance="bare"
                    size="menu-indented"
                    align="between"
                    weight="normal"
                    selected={starredOnly === option.value}
                    onclick={() => { starredOnly = option.value; }}
                  >
                    {option.label}
                    {#if starredOnly === option.value}<span>✓</span>{/if}
                  </Button>
                {/each}
                <p class="px-6 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Checked</p>
                <Button
                  tone="neutral"
                  appearance="bare"
                  size="menu-indented"
                  align="between"
                  weight="normal"
                  selected={!hideDone}
                  onclick={() => { hideDone = false; }}
                >
                  Show checked
                  {#if !hideDone}<span>✓</span>{/if}
                </Button>
                <Button
                  tone="neutral"
                  appearance="bare"
                  size="menu-indented"
                  align="between"
                  weight="normal"
                  selected={hideDone}
                  onclick={() => { hideDone = true; }}
                >
                  Hide checked
                  {#if hideDone}<span>✓</span>{/if}
                </Button>
              </div>
            {/if}
          </div>
          <div class="border-t border-gray-100 mt-1 pt-1">
            <Button
              tone="neutral"
              appearance="bare"
              size="menu"
              align="between"
              weight="normal"
              onclick={() => {
                sortSubmenuOpen = !sortSubmenuOpen;
                filterSubmenuOpen = false;
              }}
            >
              <span>Sort</span>
              <span class="text-gray-400 text-xs">{sortFields.find(field => field.value === sortField)?.label} {sortDirection === 'ASC' ? '↑' : '↓'}</span>
            </Button>
            {#if sortSubmenuOpen}
              <div class="bg-gray-50 border-t border-gray-100">
                {#each sortFields as field}
                  <Button
                    tone="neutral"
                    appearance="bare"
                    size="menu-indented"
                    align="between"
                    weight="normal"
                    selected={sortField === field.value}
                    onclick={() => { sortField = field.value; }}
                  >
                    {field.label}
                    {#if sortField === field.value}<span>✓</span>{/if}
                  </Button>
                {/each}
                <div class="border-t border-gray-200 mx-4 my-1"></div>
                <Button
                  tone="neutral"
                  appearance="bare"
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
    onSortFieldChange={(value) => { sortField = value as Exclude<SortField, 'MANUAL'>; }}
    onSortDirectionChange={(value) => { sortDirection = value; }}
  />

  {#if isTodayLoading() && entries.length === 0}
    <p class="text-center py-12 text-gray-400">Loading…</p>
  {:else if listGroups.length === 0}
    <p class="text-center py-12 text-gray-400">No items due today or overdue.</p>
  {:else}
    {#each listGroups as group (group.listId)}
      <section class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <a href="/lists/{group.listId}" class="font-semibold text-gray-900 hover:text-blue-700">
          {group.first.sourceListEmoji ?? '📋'} {group.first.sourceListName}
        </a>
        <div class="mt-4">
          {#each group.categoryGroups as categoryGroup (categoryGroup.categoryId)}
            <CategoryGroup
              categoryId={categoryGroup.categoryId}
              category={categoryGroup.category}
              items={categoryGroup.items}
              allCategories={group.categories}
              users={group.users}
              {hideDone}
              listId={group.listId}
              editable={getListCapabilities(group.first.sourceListRole).canEditItems}
              returnTo="/today"
              collapsed={collapsed[`${group.listId}:${categoryGroup.categoryId ?? 'none'}`] ?? false}
              doneCollapsed={doneCollapsed[`${group.listId}:${categoryGroup.categoryId ?? 'none'}`] ?? true}
              onchanged={refreshToday}
              oncollapsedchange={(value) => collapsed = { ...collapsed, [`${group.listId}:${categoryGroup.categoryId ?? 'none'}`]: value }}
              ondonecollapsedchange={(value) => doneCollapsed = { ...doneCollapsed, [`${group.listId}:${categoryGroup.categoryId ?? 'none'}`]: value }}
            />
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>
