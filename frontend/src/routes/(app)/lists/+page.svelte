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
        <span class="text-gray-300">›</span>
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
  {:else}
    <button
      onclick={() => { showAddForm = true; }}
      class="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
    >
      + New list
    </button>
  {/if}
</div>
