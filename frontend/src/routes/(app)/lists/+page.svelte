<script lang="ts">
  import { goto } from '$app/navigation';
  import { getLists, createList, isLoading } from '$lib/stores/lists.svelte';
  import ListForm from '$lib/components/ListForm.svelte';

  const lists = $derived(getLists());

  let showAddForm = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);

  async function handleSave({ name, emoji }: { name: string; emoji: string }) {
    saving = true;
    error = null;
    try {
      const created = await createList({ name, emoji });
      showAddForm = false;
      goto(`/lists/${created.id}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create list';
    } finally {
      saving = false;
    }
  }
</script>

<div>
  {#if isLoading()}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="grid gap-3">
      {#each lists as list (list.id)}
        <a
          href="/lists/{list.id}"
          class="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
        >
          <span class="text-3xl">{list.emoji ?? '📋'}</span>
          <div class="flex-1">
            <h2 class="font-semibold text-gray-900">{list.name}</h2>
          </div>
          <span class="text-gray-300">›</span>
        </a>
      {/each}
    </div>

    {#if error}
      <p class="mt-3 text-sm text-red-600">{error}</p>
    {/if}

    {#if showAddForm}
      <div class="mt-4">
        <ListForm
          onsubmit={handleSave}
          oncancel={() => { showAddForm = false; error = null; }}
        />
      </div>
    {:else}
      <button
        onclick={() => { showAddForm = true; }}
        disabled={saving}
        class="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
      >
        + New list
      </button>
    {/if}
  {/if}
</div>
