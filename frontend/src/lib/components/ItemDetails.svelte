<script lang="ts">
  import type { Category, TodoItem, User } from '$lib/mock-data';
  import DueDateChip from './DueDateChip.svelte';
  import RecurrenceIndicator from './RecurrenceIndicator.svelte';

  let { item, categories, users }: {
    item: TodoItem;
    categories: Category[];
    users: User[];
  } = $props();

  const category = $derived(categories.find((entry) => entry.id === item.categoryId));
  const assignedUsers = $derived(users.filter((user) => item.assignedUserIds.includes(user.id)));
</script>

<article class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
  <div>
    <p class="text-xs font-medium text-gray-500">Title</p>
    <h1 class="text-lg font-semibold text-gray-900">{item.title}</h1>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <p class="text-xs font-medium text-gray-500">Status</p>
      <p class="text-sm text-gray-900">{item.done ? 'Completed' : 'Not completed'}</p>
    </div>
    <div>
      <p class="text-xs font-medium text-gray-500">Starred</p>
      <p class="text-sm text-gray-900">{item.starred ? 'Yes' : 'No'}</p>
    </div>
    <div>
      <p class="text-xs font-medium text-gray-500">Category</p>
      <p class="text-sm text-gray-900">{category?.name ?? 'Uncategorized'}</p>
    </div>
    <div>
      <p class="text-xs font-medium text-gray-500">Due date</p>
      {#if item.dueDate}<DueDateChip dueDate={item.dueDate} />{:else}<p class="text-sm text-gray-400">None</p>{/if}
    </div>
    <div>
      <p class="text-xs font-medium text-gray-500">Recurrence</p>
      {#if item.recurrenceRule}<RecurrenceIndicator rule={item.recurrenceRule} />{:else}<p class="text-sm text-gray-400">None</p>{/if}
    </div>
    <div>
      <p class="text-xs font-medium text-gray-500">Assigned to</p>
      <p class="text-sm text-gray-900">
        {assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : 'No one'}
      </p>
    </div>
  </div>

  <div>
    <p class="text-xs font-medium text-gray-500">Notes</p>
    <p class="text-sm text-gray-900 whitespace-pre-wrap">{item.notes ?? 'None'}</p>
  </div>
</article>
