<script lang="ts">
  import type { Filters } from '$lib/utils';

  let {
    filters,
    onchange
  }: {
    filters: Filters;
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
</div>
