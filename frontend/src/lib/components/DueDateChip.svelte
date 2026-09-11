<script lang="ts">
  import { formatDueDate, isDueDateOverdue, isDueDateToday } from '$lib/utils';
  let { dueDate }: { dueDate: string | null } = $props();
</script>

{#if dueDate}
  {@const overdue = isDueDateOverdue(dueDate)}
  {@const isToday = isDueDateToday(dueDate)}
  <span class="text-xs font-medium {overdue ? 'text-danger' : isToday ? 'text-due-today-indicator' : 'text-muted'}">
    {formatDueDate(dueDate)}
  </span>
{/if}
