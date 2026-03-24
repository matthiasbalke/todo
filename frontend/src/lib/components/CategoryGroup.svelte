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
</script>

<div class="mb-6">
  <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
    {category?.name ?? 'Uncategorized'}
  </h3>
  <div class="space-y-2">
    {#each items as item (item.id)}
      <ItemCard {item} categories={allCategories} />
    {/each}
  </div>
</div>
