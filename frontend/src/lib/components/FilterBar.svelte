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

  const dueDateValue = $derived(
    filters.hideFuture ? 'hideFuture' : filters.hideUndated ? 'hideUndated' : 'all'
  );

  function setDueDate(value: string) {
    onchange({ ...filters, hideFuture: value === 'hideFuture', hideUndated: value === 'hideUndated' });
  }
</script>

<div class="flex items-center gap-2 flex-wrap">
  <select
    value={filters.starredOnly ? 'starred' : 'all'}
    onchange={(e) => onchange({ ...filters, starredOnly: (e.target as HTMLSelectElement).value === 'starred' })}
    class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all">All items</option>
    <option value="starred">Starred only</option>
  </select>

  <select
    value={dueDateValue}
    onchange={(e) => setDueDate((e.target as HTMLSelectElement).value)}
    class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all">Any due date</option>
    <option value="hideFuture">Hide future</option>
    <option value="hideUndated">Has due date</option>
  </select>

  <select
    value={filters.categoryId ?? ''}
    onchange={(e) => onchange({ ...filters, categoryId: (e.target as HTMLSelectElement).value || null })}
    class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">All categories</option>
    {#each categories as cat (cat.id)}
      <option value={cat.id}>{cat.name}</option>
    {/each}
  </select>
</div>
