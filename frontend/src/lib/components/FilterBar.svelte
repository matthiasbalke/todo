<script lang="ts">
  import type { Category } from '$lib/mock-data';
  import type { Filters } from '$lib/utils';

  let {
    filters,
    categories,
    onchange
  }: {
    filters: Filters;
    categories: Category[];
    onchange: (f: Filters) => void;
  } = $props();

  function toggle(key: keyof Filters) {
    onchange({ ...filters, [key]: !filters[key] });
  }

  function setCategory(id: string | null) {
    onchange({ ...filters, categoryId: id });
  }
</script>

<div class="flex items-center gap-2 overflow-x-auto pb-1">
  <button
    onclick={() => toggle('starredOnly')}
    class="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
      {filters.starredOnly ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
  >
    ★ Starred
  </button>
  <button
    onclick={() => toggle('hideFuture')}
    class="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
      {filters.hideFuture ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
  >
    Hide future
  </button>
  <button
    onclick={() => toggle('hideUndated')}
    class="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
      {filters.hideUndated ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
  >
    Has due date
  </button>
  <div class="w-px h-5 bg-gray-200 flex-shrink-0"></div>
  <button
    onclick={() => setCategory(null)}
    class="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
      {filters.categoryId === null ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
  >
    All
  </button>
  {#each categories as cat (cat.id)}
    <button
      onclick={() => setCategory(cat.id)}
      class="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        {filters.categoryId === cat.id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
    >
      {cat.name}
    </button>
  {/each}
</div>
