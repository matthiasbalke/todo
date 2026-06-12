<script lang="ts">
  import type { Filters } from '$lib/utils';
  import Select from './Select.svelte';

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

  const starredOptions = ['all', 'starred'];
  const dueDateOptions = ['all', 'hideFuture', 'hideUndated'];
  const filterLabels: Record<string, string> = {
    all: 'All items',
    starred: 'Starred only',
    hideFuture: 'Hide future',
    hideUndated: 'Has due date'
  };
  const dueDateLabels: Record<string, string> = { ...filterLabels, all: 'Any due date' };
</script>

<div class="flex items-center gap-2 flex-wrap">
  <Select
    options={starredOptions}
    selected={filters.starredOnly ? 'starred' : 'all'}
    getOptionLabel={(value) => filterLabels[value]}
    onSelect={(value) => onchange({ ...filters, starredOnly: value === 'starred' })}
    size="compact"
  />

  <Select
    options={dueDateOptions}
    selected={dueDateValue}
    getOptionLabel={(value) => dueDateLabels[value]}
    onSelect={setDueDate}
    size="compact"
  />
</div>
