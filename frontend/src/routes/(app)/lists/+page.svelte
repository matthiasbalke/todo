<script lang="ts">
  import { goto } from '$app/navigation';
  import type { List, ListGroup } from '$lib/mock-data';
  import { getLists, getListGroups, createList, createListGroup, isLoading, reorderListGroupsOptimistic } from '$lib/stores/lists.svelte';
  import { isDraggingAny } from '$lib/stores/drag.svelte';
  import ListGroupSection from '$lib/components/ListGroupSection.svelte';
  import FixedActionFooter from '$lib/components/FixedActionFooter.svelte';
  import { dragHandleZone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { friendlyError } from '$lib/api/errors';
  import { withDragAutoScrollOptions } from '$lib/dndOptions';
  import Button from '$lib/components/Button.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { getTodayUnfinishedCount, loadTodayCount } from '$lib/stores/today.svelte';
  import { onMount, untrack } from 'svelte';
  import { primeMobileKeyboard } from '$lib/utils/focus';
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

  let creatingList = $state(false);
  let error = $state<string | null>(null);
  let creatingGroup = $state(false);
  let focusGroupId = $state<string | null>(null);
  let groupError = $state<string | null>(null);
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

  async function handleCreateList() {
    if (creatingList) return;
    const releaseKeyboardBridge = primeMobileKeyboard();
    creatingList = true;
    error = null;
    try {
      const created = await createList({ name: 'unnamed list', emoji: '📋' });
      goto(`/lists/${created.id}?focusTitle=1`);
    } catch (e) {
      releaseKeyboardBridge();
      error = friendlyError(e, 'Failed to create list');
    } finally {
      creatingList = false;
    }
  }

  async function handleCreateGroup() {
    if (creatingGroup) return;
    const releaseKeyboardBridge = primeMobileKeyboard();
    creatingGroup = true;
    groupError = null;
    try {
      const created = await createListGroup('unnamed group');
      focusGroupId = created.id;
    } catch (e) {
      releaseKeyboardBridge();
      groupError = friendlyError(e, 'Failed to create group');
    } finally {
      creatingGroup = false;
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

<div class="pb-6">
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
        use:dragHandleZone={withDragAutoScrollOptions({ items: dndGroupWrappers, type: 'list-group', flipDurationMs: 200, dropTargetStyle: {} })}
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
              startRenaming={focusGroupId === wrapper.id}
              onrenamestarted={() => { if (focusGroupId === wrapper.id) focusGroupId = null; }}
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

<FixedActionFooter>
      <div class="flex items-center gap-3">
        <Button tone="neutral" appearance="bare"
          size="large"
          align="start"
	          onclick={handleCreateList}
	          disabled={creatingList}
	          class="flex-1"
        >
          <Icon name="plus" size="action" />
          <span>new list</span>
        </Button>
        <Button tone="neutral" appearance="outline"
          size="icon-standard"
          onclick={handleCreateGroup}
          disabled={creatingGroup}
          aria-label="Create group"
        >
          <Icon name="group" size="control" />
        </Button>
      </div>
  {#if error}
    <p class="mt-2 text-sm text-danger">{error}</p>
  {/if}
</FixedActionFooter>
