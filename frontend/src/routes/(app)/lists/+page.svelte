<script lang="ts">
  import { goto } from '$app/navigation';
  import { getLists, saveList } from '$lib/stores/lists.svelte';
  import ListForm from '$lib/components/ListForm.svelte';

  const lists = $derived(getLists());

  let showAddForm = $state(false);

  function handleSave(list: Parameters<typeof saveList>[0]) {
    saveList(list);
    showAddForm = false;
    goto(`/lists/${list.id}`);
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-900">My Lists</h1>
    <button
      onclick={() => { showAddForm = true; }}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      + New List
    </button>
  </div>

  <div class="grid gap-3">
    {#each lists as list (list.id)}
      <a
        href="/lists/{list.id}"
        class="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
      >
        <span class="text-3xl">{list.emoji}</span>
        <div class="flex-1">
          <h2 class="font-semibold text-gray-900">{list.name}</h2>
        </div>
        <div class="flex items-center gap-2">
          {#if list.id === 'grocery'}
            <button
              onclick={(e) => { e.preventDefault(); e.stopPropagation(); goto(`/lists/${list.id}/grocery`); }}
              class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium hover:bg-green-200 transition-colors"
            >
              Grocery mode
            </button>
          {/if}
          <span class="text-gray-300">›</span>
        </div>
      </a>
    {/each}
  </div>

  {#if showAddForm}
    <div class="mt-4">
      <ListForm
        onsubmit={handleSave}
        oncancel={() => { showAddForm = false; }}
      />
    </div>
  {/if}
</div>
