<script lang="ts">
  import type { Category } from '$lib/mock-data';
  import { saveCategory, deleteCategory } from '$lib/stores/lists.svelte';
  import { friendlyError } from '$lib/api/errors';
  import Button from './Button.svelte';
  import TextInput from './TextInput.svelte';

  let { categories, listId, onclose }: { categories: Category[]; listId: string; onclose: () => void } = $props();

  const COLOR_SWATCHES = [
    '#f87171', // red
    '#fb923c', // orange
    '#facc15', // yellow
    '#4ade80', // green
    '#2dd4bf', // teal
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#9ca3af', // gray
  ];

  let newName = $state('');
  let newColor = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  let editingColor = $state<string | null>(null);
  let cancelling = false;
  let error = $state<string | null>(null);

  const sorted = $derived([...categories].sort((a, b) => a.sortOrder - b.sortOrder));

  async function addCategory() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) : 0;
    error = null;
    try {
      await saveCategory({ id: crypto.randomUUID(), listId, name: trimmed, color: newColor, sortOrder: maxOrder + 1 });
      newName = '';
      newColor = null;
    } catch (e) {
      error = friendlyError(e, 'Failed to add category');
    }
  }

  function startEdit(cat: Category) {
    editingId = cat.id;
    editingName = cat.name;
    editingColor = cat.color;
  }

  async function commitEdit(cat: Category) {
    if (cancelling) {
      cancelling = false;
      editingId = null;
      return;
    }
    const trimmed = editingName.trim();
    if (!trimmed) { editingId = null; return; }
    error = null;
    try {
      await saveCategory({ ...cat, name: trimmed, color: editingColor });
    } catch (e) {
      error = friendlyError(e, 'Failed to update category');
    }
    editingId = null;
  }

  function cancelEdit() {
    cancelling = true;
    editingId = null;
  }

  async function moveUp(cat: Category) {
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    error = null;
    try {
      await saveCategory({ ...cat, sortOrder: prev.sortOrder });
      await saveCategory({ ...prev, sortOrder: cat.sortOrder });
    } catch (e) {
      error = friendlyError(e, 'Failed to reorder');
    }
  }

  async function moveDown(cat: Category) {
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    error = null;
    try {
      await saveCategory({ ...cat, sortOrder: next.sortOrder });
      await saveCategory({ ...next, sortOrder: cat.sortOrder });
    } catch (e) {
      error = friendlyError(e, 'Failed to reorder');
    }
  }

  async function removeCat(cat: Category) {
    error = null;
    try {
      await deleteCategory(cat.listId, cat.id);
    } catch (e) {
      error = friendlyError(e, 'Failed to delete category');
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  role="dialog"
  aria-modal="true"
  aria-label="Category configuration"
>
  <!-- backdrop click -->
  <Button
    variant="bare"
    size="backdrop"
    class="absolute inset-0 w-full h-full cursor-default"
    tabindex={-1}
    aria-hidden="true"
    onclick={onclose}
  ></Button>

  <div class="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h2 class="font-semibold text-gray-900">Categories</h2>
      <Button variant="bare" size="icon" onclick={onclose} class="text-gray-400 hover:text-gray-600" aria-label="Close">✕</Button>
    </div>

    {#if error}
      <p class="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</p>
    {/if}

    <!-- List -->
    <div class="overflow-y-auto flex-1 px-2 py-2">
      {#if sorted.length === 0}
        <p class="text-center text-sm text-gray-400 py-6">No categories yet.</p>
      {:else}
        {#each sorted as cat (cat.id)}
          <div class="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
            <!-- Reorder -->
            <Button
              variant="bare"
              size="icon"
              onclick={() => moveUp(cat)}
              disabled={sorted[0].id === cat.id}
              class="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
              aria-label="Move up"
            >▲</Button>
            <Button
              variant="bare"
              size="icon"
              onclick={() => moveDown(cat)}
              disabled={sorted[sorted.length - 1].id === cat.id}
              class="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
              aria-label="Move down"
            >▼</Button>

            {#if editingId === cat.id}
              <!-- Inline edit -->
              <div class="flex-1 flex flex-col gap-1">
                <!-- svelte-ignore a11y_autofocus -->
                <TextInput
                  class="w-full text-sm border-blue-300 px-2 py-0.5 focus:ring-1 focus:ring-blue-400"
                  bind:value={editingName}
                  onkeydown={(e) => { if (e.key === 'Enter') commitEdit(cat); if (e.key === 'Escape') cancelEdit(); }}
                  onblur={() => commitEdit(cat)}
                  autofocus
                />
                <div class="flex gap-1">
                  {#each COLOR_SWATCHES as swatch}
                    <Button
                      type="button"
                      variant="bare"
                      size="backdrop"
                      onmousedown={(e) => e.preventDefault()}
                      onclick={() => { editingColor = editingColor === swatch ? null : swatch; }}
                      class="w-4 h-4 rounded-full border-2 transition-all {editingColor === swatch ? 'border-gray-700 scale-110' : 'border-transparent'}"
                      style="background-color: {swatch}"
                      aria-label="Color {swatch}"
                    ></Button>
                  {/each}
                  {#if editingColor}
                    <span class="w-4 h-4 rounded-full" style="background-color: {editingColor}"></span>
                  {/if}
                </div>
              </div>
              <Button variant="bare" size="icon" onclick={() => commitEdit(cat)} class="p-0.5 text-green-500 hover:text-green-700" aria-label="Save">✓</Button>
              <Button variant="bare" size="icon" onclick={cancelEdit} class="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Cancel">✕</Button>
            {:else}
              <div class="flex-1 flex items-center gap-2">
                {#if cat.color}
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: {cat.color}"></span>
                {/if}
                <span
                  class="text-sm text-gray-800 cursor-pointer"
                  role="button"
                  tabindex="0"
                  onclick={() => startEdit(cat)}
                  onkeydown={(e) => { if (e.key === 'Enter') startEdit(cat); }}
                >{cat.name}</span>
              </div>
              <Button variant="bare" size="icon" onclick={() => startEdit(cat)} class="p-0.5 text-gray-300 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Rename">✏️</Button>
              <Button variant="bare" size="icon" onclick={() => removeCat(cat)} class="p-0.5 text-gray-300 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete">🗑</Button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer: add new -->
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-gray-100">
      <div class="flex gap-1">
        {#each COLOR_SWATCHES as swatch}
          <Button
            type="button"
            variant="bare"
            size="backdrop"
            onclick={() => { newColor = newColor === swatch ? null : swatch; }}
            class="w-4 h-4 rounded-full border-2 transition-all {newColor === swatch ? 'border-gray-700 scale-110' : 'border-transparent'}"
            style="background-color: {swatch}"
            aria-label="Color {swatch}"
          ></Button>
        {/each}
      </div>
      <div class="flex gap-2">
        {#if newColor}
          <span class="w-5 h-5 rounded-full self-center flex-shrink-0" style="background-color: {newColor}"></span>
        {/if}
        <TextInput
          class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="New category name"
          bind:value={newName}
          onkeydown={(e) => { if (e.key === 'Enter') addCategory(); }}
        />
        <Button
          onclick={addCategory}
          disabled={!newName.trim()}
          size="small"
        >Add</Button>
      </div>
    </div>
  </div>
</div>
