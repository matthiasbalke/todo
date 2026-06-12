<script lang="ts">
  import type { TodoItem, Category } from '$lib/mock-data';
  import { toggleDone } from '$lib/stores/items.svelte';
  import { friendlyError } from '$lib/api/errors';
  import Button from './Button.svelte';

  let {
    category,
    items,
    collapsed = false,
    ontoggle
  }: {
    category: Category | null;
    items: TodoItem[];
    collapsed: boolean;
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
  >
    <span class="font-semibold text-gray-800">{category?.name ?? 'Uncategorized'}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">{unchecked.length}/{items.length}</span>
      <span class="text-gray-400 transition-transform {collapsed ? '' : 'rotate-180'}">▼</span>
    </div>
  </Button>

  {#if !collapsed}
    <div class="mt-1 space-y-1">
      {#each unchecked as item (item.id)}
        <Button
          tone="neutral" appearance="outline"
          size="row"
          align="start"
          onclick={() => handleToggle(item)}
        >
          <span class="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></span>
          <span class="text-base text-gray-900">{item.title}</span>
        </Button>
      {/each}
      {#each checked as item (item.id)}
        <Button
          tone="neutral" appearance="outline"
          size="row"
          align="start"
          onclick={() => handleToggle(item)}
          class="opacity-50"
        >
          <span class="w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex-shrink-0 flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </span>
          <span class="text-base text-gray-400 line-through">{item.title}</span>
        </Button>
      {/each}
    </div>
  {/if}
</div>
