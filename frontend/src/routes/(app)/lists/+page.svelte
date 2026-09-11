<script lang="ts">
  import { goto } from '$app/navigation';
  import type { List, ListGroup } from '$lib/mock-data';
  import { getLists, getListGroups, createList, createListGroup, isLoading, reorderListGroupsOptimistic } from '$lib/stores/lists.svelte';
  import { isDraggingAny } from '$lib/stores/drag.svelte';
  import ListForm from '$lib/components/ListForm.svelte';
  import ListGroupSection from '$lib/components/ListGroupSection.svelte';
  import FixedActionFooter from '$lib/components/FixedActionFooter.svelte';
  import { dragHandleZone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { friendlyError } from '$lib/api/errors';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { getTodayUnfinishedCount, loadTodayCount } from '$lib/stores/today.svelte';
  import { onMount, untrack } from 'svelte';
  import {
    deleteListGroupState,
    loadListGroupState,
    saveListGroupState,
    UNGROUPED_LIST_GROUP_STATE_KEY,
  } from '$lib/listGroupState';

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
  const savedListGroupState = untrack(() => loadListGroupState());
  let collapsedGroups = $state<Record<string, boolean>>(savedListGroupState?.collapsed ?? {});

  $effect(() => {
    if (!localGroupDragging) {
      dndGroupWrappers = groupWrappers.slice();
    }
  });

  $effect(() => {
    const collapsed = Object.fromEntries(Object.entries(collapsedGroups).filter(([, value]) => value));
    if (Object.keys(collapsed).length === 0) deleteListGroupState();
    else saveListGroupState({ collapsed });
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

  function setGroupCollapsed(groupKey: string, value: boolean) {
    const next = { ...collapsedGroups };
    if (value) next[groupKey] = true;
    else delete next[groupKey];
    collapsedGroups = next;
  }
</script>

<div class="pb-32">
  {#if isLoading()}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <div class="h-16 bg-surface-subtle rounded-xl animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="space-y-2">
      {#if profile?.todayViewEnabled}
        <div class="flex items-center gap-4 p-4 rounded-xl border border-primary-subtle bg-primary-surface hover:border-primary-soft hover:shadow-sm transition-all mb-4">
          <div class="flex-shrink-0 w-5" aria-hidden="true"></div>
          <a href="/today" class="flex items-center gap-4 flex-1 min-w-0">
            <span class="text-3xl">📆</span>
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-primary-heading">Today</h2>
            </div>
            <span class="rounded-full bg-primary-subtle px-2 py-0.5 text-sm text-primary-emphasis">{todayCount}</span>
            <Icon name="next" size="compact" tone="muted" class="flex-shrink-0" />
          </a>
        </div>
      {/if}
      {#if groupError}
        <p class="px-1 text-sm text-danger">{groupError}</p>
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
              collapsed={collapsedGroups[wrapper.id] ?? false}
              oncollapsedchange={(value) => setGroupCollapsed(wrapper.id, value)}
            />
          </div>
        {/each}
      </div>

      {#if ungroupedLists.length > 0 || draggingAny}
        <ListGroupSection
          group={null}
          lists={ungroupedLists}
          collapsed={collapsedGroups[UNGROUPED_LIST_GROUP_STATE_KEY] ?? false}
          oncollapsedchange={(value) => setGroupCollapsed(UNGROUPED_LIST_GROUP_STATE_KEY, value)}
        />
      {/if}
    </div>
  {/if}
</div>

<FixedActionFooter expanded={showAddForm || addingGroup}>
  {#if showAddForm}
        <ListForm
          onsubmit={handleSave}
          oncancel={() => { showAddForm = false; error = null; }}
        />
  {:else if addingGroup}
      <div class="bg-surface rounded-xl border border-border p-4 space-y-3">
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
          <p class="text-sm text-danger">{groupError}</p>
        {/if}
      </div>
  {:else}
      <div class="flex items-center gap-3">
        <Button tone="neutral" appearance="bare"
          size="large"
          align="start"
          onclick={() => { showAddForm = true; }}
          disabled={saving}
          class="flex-1 rounded-xl px-4 py-3"
        >
          <Icon name="plus" size="action" />
          <span>new list</span>
        </Button>
        <Button tone="neutral" appearance="outline"
          size="icon-standard"
          onclick={() => { addingGroup = true; }}
          aria-label="Create group"
        >
          <Icon name="group" size="control" />
        </Button>
      </div>
  {/if}
  {#if error}
    <p class="mt-2 text-sm text-danger">{error}</p>
  {/if}
</FixedActionFooter>
