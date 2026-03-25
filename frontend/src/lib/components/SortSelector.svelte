<script lang="ts">
  import type { SortField, SortDirection } from '$lib/mock-data';

  let {
    value,
    direction,
    onchange
  }: {
    value: SortField;
    direction: SortDirection;
    onchange: (field: SortField, dir: SortDirection) => void;
  } = $props();

  const fields: { value: SortField; label: string }[] = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'DUE_DATE', label: 'Due Date' },
    { value: 'STARRED', label: 'Starred' },
    { value: 'CREATED', label: 'Created' }
  ];
</script>

<div class="flex items-center gap-2">
  <select
    value={value}
    onchange={(e) => onchange((e.target as HTMLSelectElement).value as SortField, direction)}
    class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {#each fields as f}
      <option value={f.value}>{f.label}</option>
    {/each}
  </select>
  <button
    onclick={() => onchange(value, direction === 'ASC' ? 'DESC' : 'ASC')}
    class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 hover:bg-gray-50"
    title="Toggle direction"
  >
    {direction === 'ASC' ? '↑' : '↓'}
  </button>
</div>
