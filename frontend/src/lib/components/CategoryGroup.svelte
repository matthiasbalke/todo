<script lang="ts">
  import type { TodoItem, Category } from '$lib/mock-data';
  import ItemCard from './ItemCard.svelte';

  let {
    categoryId,
    category,
    items,
    allCategories
  }: {
    categoryId: string | null;
    category: Category | null;
    items: TodoItem[];
    allCategories: Category[];
  } = $props();

  let collapsed = $state(false);
</script>

<div class="mb-6">
  <button
    class="flex items-center justify-between w-full px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors"
    onclick={() => { collapsed = !collapsed; }}
    role="heading"
    aria-level={3}
    aria-expanded={!collapsed}
  >
    {category?.name ?? 'Uncategorized'}
    <span class="font-normal normal-case tracking-normal" aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
  </button>
  {#if !collapsed}
    <div class="space-y-2">
      {#each items as item (item.id)}
        <ItemCard {item} categories={allCategories} />
      {/each}
    </div>
  {/if}
</div>
