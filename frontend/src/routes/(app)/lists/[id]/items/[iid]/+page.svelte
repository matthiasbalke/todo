<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, loadItemsForList, updateItem, deleteItem } from '$lib/stores/items.svelte';
  import { getList, getCategoriesForList, loadCategoriesForList } from '$lib/stores/lists.svelte';
  import type { TodoItem, User } from '$lib/mock-data';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import { goto } from '$app/navigation';
  import { friendlyError } from '$lib/api/errors';
  import { getMembers } from '$lib/api/lists';

  let { data }: { data: PageData } = $props();

  $effect(() => { loadItemsForList(data.id); });
  $effect(() => { loadCategoriesForList(data.id); });

  let members = $state<User[]>([]);
  $effect(() => {
    getMembers(data.id).then(ms => {
      members = ms.map(m => ({ id: m.userId, name: m.displayName || m.email, email: m.email }));
    }).catch(() => {});
  });

  const list = $derived(getList(data.id));
  const item = $derived(getItems().find(i => i.id === data.iid && i.listId === data.id));
  const categories = $derived(getCategoriesForList(data.id));

  async function handleSave(updated: TodoItem) {
    try {
      await updateItem(data.id, data.iid, {
        title: updated.title,
        notes: updated.notes,
        categoryId: updated.categoryId,
        dueDate: updated.dueDate,
        starred: updated.starred,
        recurrenceRule: updated.recurrenceRule,
        assignedUserIds: updated.assignedUserIds,
        sortOrder: updated.sortOrder,
      });
      goto(`/lists/${data.id}`);
    } catch (e) {
      alert(friendlyError(e, 'Failed to save item'));
    }
  }

  function handleCancel() {
    goto(`/lists/${data.id}`);
  }

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem(data.id, data.iid);
      goto(`/lists/${data.id}`);
    } catch (e) {
      alert(friendlyError(e, 'Failed to delete item'));
    }
  }
</script>

<div>
  <div class="flex items-center gap-3 mb-6">
    <a href="/lists/{data.id}" class="text-gray-400 hover:text-gray-600">←</a>
    {#if list}
      <span class="text-sm text-gray-400">{list.emoji} {list.name}</span>
    {/if}
  </div>

  {#if item}
    <ItemForm
      {item}
      listId={data.id}
      {categories}
      users={members}
      onsubmit={handleSave}
      oncancel={handleCancel}
    />
    <div class="mt-4">
      <button
        type="button"
        onclick={handleDelete}
        class="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        Delete item
      </button>
    </div>
  {:else}
    <div class="text-center py-12 text-gray-400">Item not found.</div>
  {/if}
</div>
