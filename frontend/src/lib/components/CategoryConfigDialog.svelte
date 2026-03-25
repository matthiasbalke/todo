<script lang="ts">
  import type { Category } from '$lib/mock-data';
  import { saveCategory, deleteCategory } from '$lib/stores/lists.svelte';

  let { categories, listId, onclose }: { categories: Category[]; listId: string; onclose: () => void } = $props();

  let newName = $state('');
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  let cancelling = false;

  const sorted = $derived([...categories].sort((a, b) => a.sortOrder - b.sortOrder));

  function addCategory() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) : 0;
    saveCategory({ id: crypto.randomUUID(), listId, name: trimmed, sortOrder: maxOrder + 1 });
    newName = '';
  }

  function startEdit(cat: Category) {
    editingId = cat.id;
    editingName = cat.name;
  }

  function commitEdit(cat: Category) {
    if (cancelling) {
      cancelling = false;
      editingId = null;
      return;
    }
    const trimmed = editingName.trim();
    if (trimmed) saveCategory({ ...cat, name: trimmed });
    editingId = null;
  }

  function cancelEdit() {
    cancelling = true;
    editingId = null;
  }

  function moveUp(cat: Category) {
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    saveCategory({ ...cat, sortOrder: prev.sortOrder });
    saveCategory({ ...prev, sortOrder: cat.sortOrder });
  }

  function moveDown(cat: Category) {
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    saveCategory({ ...cat, sortOrder: next.sortOrder });
    saveCategory({ ...next, sortOrder: cat.sortOrder });
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  role="dialog"
  aria-modal="true"
  aria-label="Category configuration"
>
  <!-- backdrop click -->
  <button
    class="absolute inset-0 w-full h-full cursor-default"
    tabindex="-1"
    aria-hidden="true"
    onclick={onclose}
  ></button>

  <div class="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h2 class="font-semibold text-gray-900">Categories</h2>
      <button onclick={onclose} class="p-1 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">✕</button>
    </div>

    <!-- List -->
    <div class="overflow-y-auto flex-1 px-2 py-2">
      {#if sorted.length === 0}
        <p class="text-center text-sm text-gray-400 py-6">No categories yet.</p>
      {:else}
        {#each sorted as cat (cat.id)}
          <div class="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
            <!-- Reorder -->
            <button
              onclick={() => moveUp(cat)}
              disabled={sorted[0].id === cat.id}
              class="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
              aria-label="Move up"
            >▲</button>
            <button
              onclick={() => moveDown(cat)}
              disabled={sorted[sorted.length - 1].id === cat.id}
              class="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
              aria-label="Move down"
            >▼</button>

            {#if editingId === cat.id}
              <!-- Inline edit -->
              <input
                class="flex-1 text-sm border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                bind:value={editingName}
                onkeydown={(e) => { if (e.key === 'Enter') commitEdit(cat); if (e.key === 'Escape') cancelEdit(); }}
                onblur={() => commitEdit(cat)}
                autofocus
              />
              <button onclick={() => commitEdit(cat)} class="p-0.5 text-green-500 hover:text-green-700 transition-colors" aria-label="Save">✓</button>
              <button onclick={cancelEdit} class="p-0.5 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Cancel">✕</button>
            {:else}
              <span
                class="flex-1 text-sm text-gray-800 cursor-pointer"
                role="button"
                tabindex="0"
                onclick={() => startEdit(cat)}
                onkeydown={(e) => { if (e.key === 'Enter') startEdit(cat); }}
              >{cat.name}</span>
              <button onclick={() => startEdit(cat)} class="p-0.5 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all" aria-label="Rename">✏️</button>
              <button onclick={() => deleteCategory(cat.id)} class="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" aria-label="Delete">🗑</button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer: add new -->
    <div class="flex gap-2 px-4 py-3 border-t border-gray-100">
      <input
        class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="New category name"
        bind:value={newName}
        onkeydown={(e) => { if (e.key === 'Enter') addCategory(); }}
      />
      <button
        onclick={addCategory}
        disabled={!newName.trim()}
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >Add</button>
    </div>
  </div>
</div>
