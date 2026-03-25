<script lang="ts">
  import { formatDueDate, isDueDateOverdue, isDueDateToday } from '$lib/utils';
  let { dueDate }: { dueDate: string | null } = $props();
</script>

{#if dueDate}
  {@const overdue = isDueDateOverdue(dueDate)}
  {@const isToday = isDueDateToday(dueDate)}
  <span class="text-xs font-medium {overdue ? 'text-red-600' : isToday ? 'text-orange-500' : 'text-gray-500'}">
    {formatDueDate(dueDate)}
  </span>
{/if}
