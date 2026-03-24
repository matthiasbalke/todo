<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, saveItem } from '$lib/stores/items.svelte';
  import type { TodoItem } from '$lib/mock-data';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import DueDateChip from '$lib/components/DueDateChip.svelte';
  import RecurrenceIndicator from '$lib/components/RecurrenceIndicator.svelte';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  // Get live item from store (so mutations show up)
  const liveItem = $derived(getItems().find(i => i.id === data.item.id) ?? data.item);

  let editing = $state(false);

  const category = $derived(data.categories.find(c => c.id === liveItem.categoryId));
  const assignedUser = $derived(data.users.find(u => u.id === liveItem.assignedUserId));

  function handleSave(updated: TodoItem) {
    saveItem(updated);
    editing = false;
  }

  function handleCancel() {
    editing = false;
  }
</script>

<div>
  <div class="flex items-center gap-3 mb-6">
    <a href="/lists/{data.list.id}" class="text-gray-400 hover:text-gray-600">←</a>
    <span class="text-sm text-gray-400">{data.list.emoji} {data.list.name}</span>
  </div>

  {#if editing}
    <ItemForm
      item={liveItem}
      listId={data.list.id}
      categories={data.categories}
      users={data.users}
      onsubmit={handleSave}
      oncancel={handleCancel}
    />
  {:else}
    <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-xl font-bold text-gray-900 {liveItem.done ? 'line-through text-gray-400' : ''}">
          {liveItem.title}
        </h1>
        <button
          onclick={() => { editing = true; }}
          class="flex-shrink-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <PriorityBadge priority={liveItem.priority} />
        <DueDateChip dueDate={liveItem.dueDate} />
        <RecurrenceIndicator rule={liveItem.recurrenceRule} />
      </div>

      {#if liveItem.notes}
        <div class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          {liveItem.notes}
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-3 text-sm">
        {#if category}
          <div>
            <span class="text-xs text-gray-400 block mb-1">Category</span>
            <span class="text-gray-700">{category.name}</span>
          </div>
        {/if}
        {#if assignedUser}
          <div>
            <span class="text-xs text-gray-400 block mb-1">Assigned to</span>
            <span class="text-gray-700">{assignedUser.name}</span>
          </div>
        {/if}
        <div>
          <span class="text-xs text-gray-400 block mb-1">Status</span>
          <span class="text-gray-700">{liveItem.done ? '✓ Done' : 'Active'}</span>
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Starred</span>
          <span class="text-gray-700">{liveItem.starred ? '★ Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  {/if}
</div>
