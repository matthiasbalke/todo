<script lang="ts">
  import type { TodoItem, Category, User } from '$lib/mock-data';
  import { toggleDone, toggleStarred } from '$lib/stores/items.svelte';
  import PriorityBadge from './PriorityBadge.svelte';
  import DueDateChip from './DueDateChip.svelte';
  import RecurrenceIndicator from './RecurrenceIndicator.svelte';

  let { item, categories, users }: { item: TodoItem; categories: Category[]; users: User[] } = $props();
  const assignedUser = $derived(users.find(u => u.id === item.assignedUserId) ?? null);

  function handleDone(e: Event) {
    e.preventDefault();
    toggleDone(item.id);
  }

  function handleStar(e: Event) {
    e.preventDefault();
    toggleStarred(item.id);
  }
</script>

<div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
  <button
    onclick={handleDone}
    class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 {item.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'} transition-colors"
    aria-label={item.done ? 'Mark undone' : 'Mark done'}
  >
    {#if item.done}
      <svg class="w-3 h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
      </svg>
    {/if}
  </button>

  <a href="/lists/{item.listId}/items/{item.id}" class="flex-1 min-w-0">
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-medium text-gray-900 {item.done ? 'line-through text-gray-400' : ''}">
        {item.title}
      </span>
      <div class="flex items-center gap-1 flex-shrink-0">
        <PriorityBadge priority={item.priority} />
      </div>
    </div>
    <div class="flex items-center gap-2 mt-1 flex-wrap">
      <DueDateChip dueDate={item.dueDate} />
      <RecurrenceIndicator rule={item.recurrenceRule} />
      {#if item.notes}
        <span class="text-xs text-gray-400 truncate max-w-32">📝 {item.notes}</span>
      {/if}
    </div>
  </a>

  {#if assignedUser}
    <div
      class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold"
      title={assignedUser.name}
    >
      {assignedUser.name[0].toUpperCase()}
    </div>
  {/if}

  <button
    onclick={handleStar}
    class="flex-shrink-0 text-lg leading-none {item.starred ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'} transition-colors"
    aria-label={item.starred ? 'Unstar' : 'Star'}
  >★</button>
</div>
