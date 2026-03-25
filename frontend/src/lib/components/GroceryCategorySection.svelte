<script lang="ts">
  import type { TodoItem, Category } from '$lib/mock-data';
  import { toggleDone } from '$lib/stores/items.svelte';

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
</script>

<div class="mb-4">
  <button
    onclick={ontoggle}
    class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-left"
  >
    <span class="font-semibold text-gray-800">{category?.name ?? 'Uncategorized'}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">{unchecked.length}/{items.length}</span>
      <span class="text-gray-400 transition-transform {collapsed ? '' : 'rotate-180'}">▼</span>
    </div>
  </button>

  {#if !collapsed}
    <div class="mt-1 space-y-1">
      {#each unchecked as item (item.id)}
        <button
          onclick={() => toggleDone(item.id)}
          class="w-full flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-gray-100 text-left"
        >
          <span class="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></span>
          <span class="text-base text-gray-900">{item.title}</span>
        </button>
      {/each}
      {#each checked as item (item.id)}
        <button
          onclick={() => toggleDone(item.id)}
          class="w-full flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-gray-100 text-left opacity-50"
        >
          <span class="w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex-shrink-0 flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </span>
          <span class="text-base text-gray-400 line-through">{item.title}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
