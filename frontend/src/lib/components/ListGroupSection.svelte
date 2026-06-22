<script lang="ts">
  import type { List, ListGroup } from '$lib/mock-data';
  import { renameListGroup, deleteListGroup, assignListGroup, reorderListInGroup } from '$lib/stores/lists.svelte';
  import { isDraggingAny, setDraggingAny } from '$lib/stores/drag.svelte';
  import { dragHandleZone, dragHandle, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { friendlyError } from '$lib/api/errors';
  import Button from './Button.svelte';
  import TextInput from './TextInput.svelte';

  let {
    group,
    lists,
    showGroupDragHandle = false,
  }: {
    group: ListGroup | null;
    lists: List[];
    showGroupDragHandle?: boolean;
  } = $props();

  let collapsed = $state(false);
  let showMenu = $state(false);
  let renaming = $state(false);
  let newName = $state('');
  let error = $state<string | null>(null);
  let localDragging = $state(false);
  let groupDragHandleElement = $state<HTMLButtonElement | null>(null);

  const sortedLists = $derived(lists.slice().sort((a, b) => a.sortOrderInGroup - b.sortOrderInGroup));
  let dndItems = $state<List[]>([]);

  $effect(() => {
    if (!groupDragHandleElement || !showGroupDragHandle || group === null) return;
    const action = dragHandle(groupDragHandleElement);
    return () => action?.destroy?.();
  });

  $effect(() => {
    if (!localDragging) {
      dndItems = sortedLists.slice();
    }
  });

  const draggingAny = $derived(isDraggingAny());

  function handleConsider(e: CustomEvent<{ items: List[] }>) {
    if (!localDragging) setDraggingAny(true);
    localDragging = true;
    dndItems = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<{ items: List[] }>) {
    localDragging = false;
    setDraggingAny(false);
    const newItems = e.detail.items.filter(i => !(i as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    dndItems = newItems;

    const currentGroupId = group?.id ?? null;

    for (const item of newItems) {
      if (item.groupId !== currentGroupId) {
        try {
          await assignListGroup(item.id, currentGroupId);
        } catch (err) {
          error = friendlyError(err, 'Failed to move list');
        }
      }
    }

    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].sortOrderInGroup !== i) {
        try {
          await reorderListInGroup(newItems[i].id, i);
        } catch (err) {
          error = friendlyError(err, 'Failed to reorder list');
        }
      }
    }
  }

  async function handleRename() {
    if (!group || !newName.trim()) return;
    try {
      await renameListGroup(group.id, newName.trim());
      renaming = false;
      showMenu = false;
    } catch (e) {
      error = friendlyError(e, 'Failed to rename group');
    }
  }

  async function handleDelete() {
    if (!group) return;
    showMenu = false;
    try {
      await deleteListGroup(group.id);
    } catch (e) {
      error = friendlyError(e, 'Failed to delete group');
    }
  }
</script>

<div class="mb-4">
  <div class="flex items-center justify-between px-1 mb-2">
    <div class="flex items-center min-w-0">
      {#if showGroupDragHandle && group !== null}
        <Button
          bind:element={groupDragHandleElement}
          tone="neutral"
          appearance="bare"
          size="icon"
          emphasis="subtle"
          class="flex-shrink-0 w-7 h-8"
          aria-label="Drag to reorder list group"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
            <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
            <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
          </svg>
        </Button>
      {/if}
      <Button
        tone="neutral" appearance="bare"
        size="header"
        align="start"
        emphasis="muted"
        onclick={() => { collapsed = !collapsed; }}
        aria-expanded={!collapsed}
      >
        <span class="font-normal normal-case tracking-normal">{collapsed ? '▶' : '▼'}</span>
        {#if group !== null && !renaming}
          <span>{group.name}</span>
        {:else if group === null}
          <span>Ungrouped</span>
        {/if}
      </Button>
    </div>

    {#if group !== null}
      {#if renaming}
        <div class="flex items-center gap-2 flex-1 ml-2">
          <TextInput
            bind:value={newName}
            containerClass="flex-1"
            size="compact"
            class="w-full"
            onkeydown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { renaming = false; newName = group?.name ?? ''; } }}
          />
          <Button tone="primary" appearance="bare" size="compact" onclick={handleRename}>Save</Button>
          <Button tone="neutral" appearance="bare" size="compact" emphasis="muted" onclick={() => { renaming = false; newName = group?.name ?? ''; }}>Cancel</Button>
        </div>
      {:else}
        <div class="relative">
          <Button
            tone="neutral" appearance="bare"
            size="icon"
            onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }}
            emphasis="subtle"
            aria-label="Group options"
          >
            ⋯
          </Button>
          {#if showMenu}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="fixed inset-0 z-10"
              onclick={() => { showMenu = false; }}
              onkeydown={() => {}}
            ></div>
            <div class="absolute right-0 mt-1 z-20 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[120px]">
              <Button
                tone="neutral" appearance="bare"
                size="menu"
                align="start"
                weight="normal"
                onclick={() => { renaming = true; newName = group?.name ?? ''; showMenu = false; }}
              >
                Rename
              </Button>
              <Button
                tone="danger" appearance="ghost"
                size="menu"
                align="start"
                weight="normal"
                onclick={handleDelete}
              >
                Delete
              </Button>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  {#if error}
    <p class="px-1 mb-2 text-xs text-red-600">{error}</p>
  {/if}

  {#if !collapsed}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      use:dragHandleZone={{ items: dndItems, type: 'list-card', flipDurationMs: 200, dropTargetStyle: {} }}
      onconsider={handleConsider}
      onfinalize={handleFinalize}
      class="space-y-2 min-h-[4px]"
    >
      {#if dndItems.length === 0 && draggingAny}
        <div class="min-h-[52px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center pointer-events-none">
          <span class="text-xs text-gray-300">Drop here</span>
        </div>
      {/if}
      {#each dndItems as list (list.id)}
        <div
          class="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all {(list as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? 'opacity-40' : ''}"
        >
          <div
            use:dragHandle
            class="flex-shrink-0 flex items-center justify-center w-5 self-center cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-400"
            aria-label="Drag to reorder"
            tabindex="-1"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
              <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
              <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
            </svg>
          </div>
          <a href="/lists/{list.id}" class="flex items-center gap-4 flex-1 min-w-0" draggable="false" oncontextmenu={(e) => e.preventDefault()}>
            <span class="text-3xl">{list.emoji ?? '📋'}</span>
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-gray-900">{list.name}</h2>
            </div>
            <span class="text-gray-300">›</span>
          </a>
        </div>
      {/each}
    </div>
  {/if}
</div>
