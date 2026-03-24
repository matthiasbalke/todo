<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, toggleDone } from '$lib/stores/items.svelte';
  import { groupByCategory } from '$lib/utils';
  import GroceryCategorySection from '$lib/components/GroceryCategorySection.svelte';

  let { data }: { data: PageData } = $props();

  let hideDone = $state(false);
  let collapsedSections = $state<Set<string | null>>(new Set());

  const allItems = $derived(getItems().filter(i => i.listId === data.list.id));
  const visibleItems = $derived(hideDone ? allItems.filter(i => !i.done) : allItems);
  const grouped = $derived(groupByCategory(visibleItems, data.categories));

  function toggleSection(key: string | null) {
    const next = new Set(collapsedSections);
    const strKey = key ?? '__null__';
    if (next.has(strKey)) {
      next.delete(strKey);
    } else {
      next.add(strKey);
    }
    collapsedSections = next;
  }

  function clearChecked() {
    hideDone = true;
  }
</script>

<div>
  <div class="flex items-center gap-3 mb-4">
    <a href="/lists/{data.list.id}" class="text-gray-400 hover:text-gray-600">←</a>
    <h1 class="text-xl font-bold text-gray-900">{data.list.emoji} {data.list.name}</h1>
    <span class="text-sm text-gray-400">Grocery mode</span>
  </div>

  <div class="flex justify-end mb-4">
    <button
      onclick={clearChecked}
      class="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
    >
      Clear checked
    </button>
  </div>

  <div>
    {#each [...grouped] as [key, { category, items }]}
      <GroceryCategorySection
        {category}
        {items}
        collapsed={collapsedSections.has(key ?? '__null__')}
        ontoggle={() => toggleSection(key)}
      />
    {/each}
  </div>
</div>
