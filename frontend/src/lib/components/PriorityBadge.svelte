<script lang="ts">
  import type { Priority } from '$lib/mock-data';
  let { priority }: { priority: Priority | null } = $props();

  const colorMap: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    NORMAL: 'bg-blue-100 text-blue-700',
    LOW: 'bg-gray-100 text-gray-600'
  };
  const labelMap: Record<string, string> = {
    URGENT: 'Urgent',
    HIGH: 'High',
    NORMAL: 'Normal',
    LOW: 'Low'
  };
</script>

{#if priority}
  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {colorMap[priority]}">
    {labelMap[priority]}
  </span>
{/if}
