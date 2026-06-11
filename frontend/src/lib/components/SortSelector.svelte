<script lang="ts">
  import type { SortField, SortDirection } from '$lib/mock-data';
  import Button from './Button.svelte';
  import Select from './Select.svelte';

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
  <Select
    options={fields}
    selected={fields.find((field) => field.value === value)}
    getOptionLabel={(field) => field.label}
    onSelect={(field) => onchange(field.value, direction)}
    compact
    triggerClass="border-gray-200 text-gray-700"
  />
  <Button
    variant="secondary"
    size="compact"
    onclick={() => onchange(value, direction === 'ASC' ? 'DESC' : 'ASC')}
    class="border-gray-200 text-sm text-gray-700"
    title="Toggle direction"
  >
    {direction === 'ASC' ? '↑' : '↓'}
  </Button>
</div>
