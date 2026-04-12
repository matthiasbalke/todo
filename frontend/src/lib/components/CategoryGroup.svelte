<script lang="ts">
  import { untrack } from 'svelte';
  import type { TodoItem, Category, User } from '$lib/mock-data';
  import ItemCard from './ItemCard.svelte';
  import { dragHandleZone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { reorderItemsOptimistic } from '$lib/stores/items.svelte';
  import { friendlyError } from '$lib/api/errors';

  let {
    categoryId,
    category,
    items,
    allCategories,
    users,
    hideDone = false,
    collapsed: collapsedProp = false,
    doneCollapsed: doneCollapsedProp = true,
    listId,
    isDraggable = false,
    oncollapsedchange,
    ondonecollapsedchange
  }: {
    categoryId: string | null;
    category: Category | null;
    items: TodoItem[];
    allCategories: Category[];
    users: User[];
    hideDone?: boolean;
    collapsed?: boolean;
    doneCollapsed?: boolean;
    listId: string;
    isDraggable?: boolean;
    oncollapsedchange?: (v: boolean) => void;
    ondonecollapsedchange?: (v: boolean) => void;
  } = $props();

  let collapsed = $state(untrack(() => collapsedProp));
  let doneCollapsed = $state(untrack(() => doneCollapsedProp));

  const undoneItems = $derived(items.filter(i => !i.done));
  const doneItems = $derived(items.filter(i => i.done));

  let dndItems = $state<TodoItem[]>([]);
  let isDragging = $state(false);

  $effect(() => {
    if (!isDragging) {
      dndItems = undoneItems.slice();
    }
  });

  function handleConsider(e: CustomEvent<{ items: TodoItem[] }>) {
    isDragging = true;
    dndItems = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<{ items: TodoItem[] }>) {
    isDragging = false;
    const newItems = e.detail.items.filter(i => !(i as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    dndItems = newItems;
    try {
      await reorderItemsOptimistic(listId, newItems.map(i => i.id));
    } catch (err) {
      alert(friendlyError(err, 'Failed to reorder items'));
    }
  }
</script>

<div class="mb-6">
  <h3 class="px-1 mb-2">
    <button
      class="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors"
      onclick={() => { collapsed = !collapsed; oncollapsedchange?.(collapsed); }}
      aria-expanded={!collapsed}
    >
      <span class="flex items-center gap-1.5">
        {#if category?.color}
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: {category.color}"></span>
        {/if}
        {category?.name ?? 'Uncategorized'}
      </span>
      <span class="font-normal normal-case tracking-normal" aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
    </button>
  </h3>
  {#if !collapsed}
    {#if isDraggable}
      <div
        use:dragHandleZone={{ items: dndItems, dropTargetStyle: {} }}
        onconsider={handleConsider}
        onfinalize={handleFinalize}
        class="space-y-2"
      >
        {#each dndItems as item (item.id)}
          <div>
            <ItemCard {item} categories={allCategories} {users} {isDraggable} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="space-y-2">
        {#each undoneItems as item (item.id)}
          <ItemCard {item} categories={allCategories} {users} />
        {/each}
      </div>
    {/if}

    {#if !hideDone && doneItems.length > 0}
      <button
        onclick={() => { doneCollapsed = !doneCollapsed; ondonecollapsedchange?.(doneCollapsed); }}
        class="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-500 transition-colors px-1"
      >
        <span>{doneCollapsed ? '▶' : '▼'}</span>
        <span>{doneItems.length} checked</span>
      </button>
      {#if !doneCollapsed}
        <div class="space-y-2 mt-1">
          {#each doneItems as item (item.id)}
            <ItemCard {item} categories={allCategories} {users} />
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</div>
