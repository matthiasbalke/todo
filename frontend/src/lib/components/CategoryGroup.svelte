<script lang="ts">
  import type { TodoItem, Category, User } from '$lib/mock-data';
  import ItemCard from './ItemCard.svelte';

  let {
    categoryId,
    category,
    items,
    allCategories,
    users,
    hideDone = false,
    collapsed: collapsedProp = false,
    doneCollapsed: doneCollapsedProp = true,
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
    oncollapsedchange?: (v: boolean) => void;
    ondonecollapsedchange?: (v: boolean) => void;
  } = $props();

  let collapsed = $state(collapsedProp);
  let doneCollapsed = $state(doneCollapsedProp);

  const undoneItems = $derived(items.filter(i => !i.done));
  const doneItems = $derived(items.filter(i => i.done));
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
    <div class="space-y-2">
      {#each undoneItems as item (item.id)}
        <ItemCard {item} categories={allCategories} {users} />
      {/each}
    </div>

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
