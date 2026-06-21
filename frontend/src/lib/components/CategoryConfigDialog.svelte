<script lang="ts">
  import type { Category } from '$lib/mock-data';
  import { saveCategory, deleteCategory, reorderCategoriesOptimistic } from '$lib/stores/lists.svelte';
  import { friendlyError } from '$lib/api/errors';
  import { dragHandleZone, dragHandle, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import Button from './Button.svelte';
  import ColorSwatchButton from './ColorSwatchButton.svelte';
  import TextInput from './TextInput.svelte';

  const CATEGORY_DND_TYPE = 'configure-category';

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
  let isDragging = $state(false);
  let dndCategories = $state<Category[]>([]);

  const sorted = $derived([...categories].sort((a, b) => a.sortOrder - b.sortOrder));

  $effect(() => {
    if (!isDragging) {
      dndCategories = sorted.slice();
    }
  });

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

  function handleConsider(e: CustomEvent<{ items: Category[] }>) {
    isDragging = true;
    dndCategories = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<{ items: Category[] }>) {
    isDragging = false;
    const previous = sorted.slice();
    const reordered = e.detail.items.filter(cat => !(cat as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    dndCategories = reordered;
    if (reordered.map(cat => cat.id).join('|') === sorted.map(cat => cat.id).join('|')) return;
    error = null;
    try {
      await reorderCategoriesOptimistic(listId, reordered.map(cat => cat.id));
    } catch (e) {
      error = friendlyError(e, 'Failed to reorder');
      dndCategories = previous;
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
    tone="neutral" appearance="bare"
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
      <Button tone="neutral" appearance="bare" size="icon" emphasis="muted" onclick={onclose} aria-label="Close">✕</Button>
    </div>

    {#if error}
      <p class="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</p>
    {/if}

    <!-- List -->
    <div class="overflow-y-auto flex-1 px-2 py-2">
      {#if sorted.length === 0}
        <p class="text-center text-sm text-gray-400 py-6">No categories yet.</p>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          use:dragHandleZone={{ items: dndCategories, type: CATEGORY_DND_TYPE, flipDurationMs: 200, dropTargetStyle: {} }}
          onconsider={handleConsider}
          onfinalize={handleFinalize}
          class="space-y-1 min-h-2"
          data-testid="category-reorder-zone"
        >
          {#each dndCategories as cat (cat.id)}
            <div class="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-50 group {(cat as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? 'opacity-40' : ''}">
              <div
                use:dragHandle
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-500"
                aria-label="Drag to reorder category"
                tabindex="-1"
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
                  <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
                  <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
                </svg>
              </div>

              {#if editingId === cat.id}
                <!-- Inline edit -->
                <div class="flex-1 flex flex-col gap-1">
                  <!-- svelte-ignore a11y_autofocus -->
                  <TextInput
                    class="w-full"
                    size="compact"
                    bind:value={editingName}
                    onkeydown={(e) => { if (e.key === 'Enter') commitEdit(cat); if (e.key === 'Escape') cancelEdit(); }}
                    onblur={() => commitEdit(cat)}
                    autofocus
                  />
                  <div class="flex gap-1">
                    {#each COLOR_SWATCHES as swatch}
                      <ColorSwatchButton
                        color={swatch}
                        selected={editingColor === swatch}
                        onselect={() => { editingColor = editingColor === swatch ? null : swatch; }}
                      />
                    {/each}
                    {#if editingColor}
                      <span class="w-4 h-4 rounded-full" style="background-color: {editingColor}"></span>
                    {/if}
                  </div>
                </div>
                <Button tone="success" appearance="bare" size="icon" onclick={() => commitEdit(cat)} aria-label="Save">✓</Button>
                <Button tone="neutral" appearance="bare" size="icon" emphasis="muted" onclick={cancelEdit} aria-label="Cancel">✕</Button>
              {:else}
                <div class="flex-1 flex items-center gap-2 min-w-0">
                  {#if cat.color}
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: {cat.color}"></span>
                  {/if}
                  <span
                    class="text-sm text-gray-800 cursor-pointer truncate"
                    role="button"
                    tabindex="0"
                    onclick={() => startEdit(cat)}
                    onkeydown={(e) => { if (e.key === 'Enter') startEdit(cat); }}
                  >{cat.name}</span>
                </div>
                <Button tone="neutral" appearance="bare" size="icon" emphasis="subtle" onclick={() => startEdit(cat)} class="sm:opacity-0 sm:group-hover:opacity-100" aria-label="Rename">✏️</Button>
                <Button tone="danger" appearance="bare" size="icon" onclick={() => removeCat(cat)} class="sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete">🗑</Button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer: add new -->
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-gray-100">
      <div class="flex gap-1">
        {#each COLOR_SWATCHES as swatch}
          <ColorSwatchButton
            color={swatch}
            selected={newColor === swatch}
            onselect={() => { newColor = newColor === swatch ? null : swatch; }}
          />
        {/each}
      </div>
      <div class="flex gap-2">
        {#if newColor}
          <span class="w-5 h-5 rounded-full self-center flex-shrink-0" style="background-color: {newColor}"></span>
        {/if}
        <TextInput
          class="flex-1"
          size="small"
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
