<script lang="ts">
  import type { PageData } from './$types';
  import { getItems, saveItem } from '$lib/stores/items.svelte';
  import { getList, getCategoriesForList } from '$lib/stores/lists.svelte';
  import type { TodoItem } from '$lib/mock-data';
  import ItemForm from '$lib/components/ItemForm.svelte';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  const list = $derived(getList(data.id));
  const item = $derived(getItems().find(i => i.id === data.iid && i.listId === data.id));
  const categories = $derived(getCategoriesForList(data.id));

  function handleSave(updated: TodoItem) {
    saveItem(updated);
    goto(`/lists/${data.id}`);
  }

  function handleCancel() {
    goto(`/lists/${data.id}`);
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
      users={data.users}
      onsubmit={handleSave}
      oncancel={handleCancel}
    />
  {:else}
    <div class="text-center py-12 text-gray-400">Item not found.</div>
  {/if}
</div>
