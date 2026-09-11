<script lang="ts">
  import type { TodoItem, Category } from '$lib/mock-data';
  import { toggleDone } from '$lib/stores/items.svelte';
  import { friendlyError } from '$lib/api/errors';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  let {
    category,
    items,
    collapsed = false,
    editable = true,
    ontoggle
  }: {
    category: Category | null;
    items: TodoItem[];
    collapsed: boolean;
    editable?: boolean;
    ontoggle: () => void;
  } = $props();

  const unchecked = $derived(items.filter(i => !i.done));
  const checked = $derived(items.filter(i => i.done));

  async function handleToggle(item: TodoItem) {
    try {
      await toggleDone(item.listId, item.id);
    } catch (e) {
      alert(friendlyError(e, 'Failed to update item'));
    }
  }
</script>

<div class="mb-4">
  <Button
    tone="neutral" appearance="soft"
    size="row-muted"
    align="between"
    onclick={ontoggle}
    aria-expanded={!collapsed}
  >
    <span class="font-semibold text-value">{category?.name ?? 'Uncategorized'}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted">{unchecked.length}/{items.length}</span>
      <Icon name={collapsed ? 'collapse' : 'expand'} size="compact" />
    </div>
  </Button>

  {#if !collapsed}
    <div class="mt-1 space-y-1">
      {#each unchecked as item (item.id)}
        {#if editable}
          <Button
            tone="neutral" appearance="outline"
            size="row"
            align="start"
            onclick={() => handleToggle(item)}
          >
            <span class="w-6 h-6 rounded-full border-2 border-border-strong flex-shrink-0"></span>
            <span class="text-base text-heading">{item.title}</span>
          </Button>
        {:else}
          <div class="flex w-full items-center justify-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <span class="w-6 h-6 rounded-full border-2 border-border-strong flex-shrink-0" aria-label="Not completed"></span>
            <span class="text-base text-heading">{item.title}</span>
          </div>
        {/if}
      {/each}
      {#each checked as item (item.id)}
        {#if editable}
          <Button
            tone="neutral" appearance="outline"
            size="row"
            align="start"
            onclick={() => handleToggle(item)}
            class="opacity-50"
          >
            <span class="w-6 h-6 rounded-full bg-success-indicator border-2 border-success-indicator flex-shrink-0 flex items-center justify-center">
              <svg class="w-3 h-3 text-on-action" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </span>
            <span class="text-base text-subdued line-through">{item.title}</span>
          </Button>
        {:else}
          <div class="flex w-full items-center justify-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 opacity-50">
          <span class="w-6 h-6 rounded-full bg-success-indicator border-2 border-success-indicator flex-shrink-0 flex items-center justify-center">
            <svg class="w-3 h-3 text-on-action" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Completed">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </span>
          <span class="text-base text-subdued line-through">{item.title}</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
