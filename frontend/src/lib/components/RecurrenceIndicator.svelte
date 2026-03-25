<script lang="ts">
  import type { RecurrenceRule } from '$lib/mock-data';
  import { recurrenceRuleToHuman } from '$lib/utils';
  let { rule }: { rule: RecurrenceRule | null } = $props();
</script>

{#if rule}
  <span class="text-xs text-gray-400 flex items-center gap-1">
    <span>↻</span>
    <span>{recurrenceRuleToHuman(rule)}</span>
  </span>
{/if}
