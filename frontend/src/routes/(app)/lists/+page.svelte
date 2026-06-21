<script lang="ts">
  import { goto } from '$app/navigation';
  import type { List, ListGroup } from '$lib/mock-data';
  import { getLists, getListGroups, createList, createListGroup, isLoading, reorderListGroupsOptimistic } from '$lib/stores/lists.svelte';
  import { isDraggingAny } from '$lib/stores/drag.svelte';
  import ListForm from '$lib/components/ListForm.svelte';
  import ListGroupSection from '$lib/components/ListGroupSection.svelte';
  import { dragHandleZone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { friendlyError } from '$lib/api/errors';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { getTodayUnfinishedCount, loadTodayCount } from '$lib/stores/today.svelte';
  import { onMount } from 'svelte';

  const lists = $derived(getLists());
  const groups = $derived(getListGroups());
  const draggingAny = $derived(isDraggingAny());
  const profile = $derived(getProfile());
  const todayCount = $derived(getTodayUnfinishedCount());

  onMount(() => {
    if (profile?.todayViewEnabled) loadTodayCount();
    const refresh = () => {
      if (document.visibilityState === 'visible' && profile?.todayViewEnabled) loadTodayCount();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });

  const sortedGroups = $derived(groups.slice().sort((a, b) => a.sortOrder - b.sortOrder));
  const ungroupedLists = $derived(lists.filter(l => l.groupId === null));
  const groupWrappers = $derived(sortedGroups.map(group => ({
    id: group.id,
    group,
    lists: lists.filter(list => list.groupId === group.id),
  })));

  let showAddForm = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let addingGroup = $state(false);
  let newGroupName = $state('');
  let groupError = $state<string | null>(null);
  let groupInput = $state<HTMLInputElement | null>(null);
  let localGroupDragging = $state(false);
  let dndGroupWrappers = $state<{ id: string; group: ListGroup; lists: List[] }[]>([]);

  $effect(() => {
    if (!localGroupDragging) {
      dndGroupWrappers = groupWrappers.slice();
    }
  });

  $effect(() => {
    if (addingGroup) {
      groupInput?.focus();
    }
  });

  async function handleSave({ name, emoji }: { name: string; emoji: string }) {
    saving = true;
    error = null;
    try {
      const created = await createList({ name, emoji });
      showAddForm = false;
      goto(`/lists/${created.id}`);
    } catch (e) {
      error = friendlyError(e, 'Failed to create list');
    } finally {
      saving = false;
    }
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    groupError = null;
    try {
      await createListGroup(newGroupName.trim());
      newGroupName = '';
      addingGroup = false;
    } catch (e) {
      groupError = friendlyError(e, 'Failed to create group');
    }
  }

  function handleGroupConsider(e: CustomEvent<{ items: typeof dndGroupWrappers }>) {
    localGroupDragging = true;
    dndGroupWrappers = e.detail.items;
  }

  async function handleGroupFinalize(e: CustomEvent<{ items: typeof dndGroupWrappers }>) {
    localGroupDragging = false;
    const reordered = e.detail.items.filter(item => !(item as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    dndGroupWrappers = reordered;
    const reorderedIds = reordered.map(item => item.id);
    if (reorderedIds.join('|') === sortedGroups.map(group => group.id).join('|')) return;

    groupError = null;
    try {
      await reorderListGroupsOptimistic(reorderedIds);
    } catch (e) {
      groupError = friendlyError(e, 'Failed to reorder groups');
      dndGroupWrappers = groupWrappers.slice();
    }
  }
</script>

<div class="pb-20">
  {#if isLoading()}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="space-y-2">
      {#if profile?.todayViewEnabled}
        <div class="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all mb-4">
          <div class="flex-shrink-0 w-5" aria-hidden="true"></div>
          <a href="/today" class="flex items-center gap-4 flex-1 min-w-0">
            <span class="text-3xl">📆</span>
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-blue-900">Today</h2>
            </div>
            <span class="rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-800">{todayCount}</span>
            <span class="text-gray-300">›</span>
          </a>
        </div>
      {/if}
      {#if groupError}
        <p class="px-1 text-sm text-red-600">{groupError}</p>
      {/if}

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        use:dragHandleZone={{ items: dndGroupWrappers, type: 'list-group', flipDurationMs: 200, dropTargetStyle: {} }}
        onconsider={handleGroupConsider}
        onfinalize={handleGroupFinalize}
        data-testid="list-group-reorder-zone"
      >
        {#each dndGroupWrappers as wrapper (wrapper.id)}
          <div data-testid="list-group-wrapper">
            <ListGroupSection
              group={wrapper.group}
              lists={wrapper.lists}
              showGroupDragHandle={true}
            />
          </div>
        {/each}
      </div>

      {#if ungroupedLists.length > 0 || draggingAny}
        <ListGroupSection
          group={null}
          lists={ungroupedLists}
        />
      {/if}
    </div>
  {/if}
</div>

<div class="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg">
  <div class="max-w-2xl mx-auto px-4 py-3">
    {#if showAddForm}
      <div class="max-h-[70vh] overflow-y-auto">
        <ListForm
          onsubmit={handleSave}
          oncancel={() => { showAddForm = false; error = null; }}
        />
      </div>
    {:else if addingGroup}
      <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <TextInput
          bind:element={groupInput}
          bind:value={newGroupName}
          placeholder="Group name"
          class="w-full"
          onkeydown={(e) => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') { addingGroup = false; newGroupName = ''; } }}
        />
        <div class="flex justify-end gap-2 pt-1">
          <Button tone="neutral" appearance="bare"
            type="button"
            onclick={() => { addingGroup = false; newGroupName = ''; groupError = null; }}
            emphasis="muted"
          >
            Cancel
          </Button>
          <Button tone="primary" appearance="solid"
            onclick={handleAddGroup}
          >
            Add
          </Button>
        </div>
        {#if groupError}
          <p class="text-sm text-red-600">{groupError}</p>
        {/if}
      </div>
    {:else}
      <div class="flex gap-2">
        <Button tone="neutral" appearance="outline"
          size="empty"
          onclick={() => { showAddForm = true; }}
          disabled={saving}
          class="flex-1"
        >
          + New list
        </Button>
        <Button tone="neutral" appearance="outline"
          size="empty"
          onclick={() => { addingGroup = true; }}
        >
          + New group
        </Button>
      </div>
    {/if}
    {#if error}
      <p class="mt-2 text-sm text-red-600">{error}</p>
    {/if}
  </div>
</div>
