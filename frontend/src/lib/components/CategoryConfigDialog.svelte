<script lang="ts">
  import type { Category } from '$lib/mock-data';
  import { saveCategory, deleteCategory, reorderCategoriesOptimistic } from '$lib/stores/lists.svelte';
  import { friendlyError } from '$lib/api/errors';
  import { dragHandleZone, dragHandle, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import Button from './Button.svelte';
  import CategoryColorPicker from './CategoryColorPicker.svelte';
  import EditableLabel from './EditableLabel.svelte';
  import TextInput from './TextInput.svelte';
  import Icon from './Icon.svelte';

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
  let colorEditorCategoryId = $state<string | null>(null);
  let colorEditorValue = $state<string | null>(null);
  let pendingDeleteCategory = $state<Category | null>(null);
  let isDeletingCategory = $state(false);
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

  function validateCategoryName(value: string) {
    return value.trim() ? null : 'Category name is required';
  }

  async function renameCategory(cat: Category, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;
    error = null;
    try {
      await saveCategory({ ...cat, name: trimmed });
    } catch (e) {
      error = friendlyError(e, 'Failed to update category');
    }
  }

  function toggleColorEditor(cat: Category) {
    if (colorEditorCategoryId === cat.id) {
      colorEditorCategoryId = null;
      return;
    }
    colorEditorCategoryId = cat.id;
    colorEditorValue = cat.color;
  }

  async function updateCategoryColor(cat: Category, color: string | null) {
    colorEditorValue = color;
    if (color === cat.color) return;
    error = null;
    try {
      await saveCategory({ ...cat, color });
    } catch (e) {
      error = friendlyError(e, 'Failed to update category');
    }
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

  function requestDeleteCategory(cat: Category) {
    error = null;
    pendingDeleteCategory = cat;
  }

  function cancelDeleteCategory() {
    if (isDeletingCategory) return;
    pendingDeleteCategory = null;
  }

  async function confirmDeleteCategory() {
    if (!pendingDeleteCategory) return;
    const cat = pendingDeleteCategory;
    error = null;
    isDeletingCategory = true;
    try {
      await deleteCategory(cat.listId, cat.id);
      pendingDeleteCategory = null;
    } catch (e) {
      error = friendlyError(e, 'Failed to delete category');
    } finally {
      isDeletingCategory = false;
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-overlay/40"
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

  <div class="relative z-10 w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
      <h2 class="font-semibold text-heading">Categories</h2>
      <Button tone="neutral" appearance="bare" size="icon" emphasis="muted" onclick={onclose} aria-label="Close">
        <Icon name="close" size="controlCompact" />
      </Button>
    </div>

    {#if error}
      <p class="px-4 py-2 text-sm text-danger bg-danger-surface border-b border-danger-subtle">{error}</p>
    {/if}

    <!-- List -->
    <div class="overflow-y-auto flex-1 px-2 py-2">
      {#if sorted.length === 0}
        <p class="text-center text-sm text-subdued py-6">No categories yet.</p>
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
            <div class="rounded-lg hover:bg-canvas group {(cat as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? 'opacity-40' : ''}">
              <div class="flex items-center gap-1 px-2 py-1.5">
                <div
                  use:dragHandle
                  class="flex-shrink-0 flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing touch-none text-faint hover:text-muted"
                  aria-label="Drag to reorder category"
                  tabindex="-1"
                >
                  <Icon name="drag" size="controlCompact" />
                </div>

                <Button
                  tone="neutral"
                  appearance="bare"
                  size="icon"
                  class="h-8 w-8 flex-shrink-0"
                  aria-label={`Edit color for ${cat.name}`}
                  aria-expanded={colorEditorCategoryId === cat.id}
                  onclick={() => toggleColorEditor(cat)}
                  data-testid={`category-color-control-${cat.id}`}
                >
                  {#if cat.color}
                    <span class="h-4 w-4 rounded-full" style="background-color: {cat.color}"></span>
                  {:else}
                    <span class="h-4 w-4 rounded-full border border-dashed border-muted"></span>
                  {/if}
                </Button>

                <div class="min-w-0 flex-1">
                  <EditableLabel
                    value={cat.name}
                    label="Category name"
                    ariaLabel={`Edit category name ${cat.name}`}
                    validate={validateCategoryName}
                    inputSize="compact"
                    displayAppearance="plain"
                    containerClass="w-full"
                    onchange={(value) => renameCategory(cat, value)}
                  />
                </div>

                <Button tone="danger" appearance="bare" size="icon" onclick={() => requestDeleteCategory(cat)} class="sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete">
                  <Icon name="delete" size="controlCompact" />
                </Button>
              </div>

              {#if colorEditorCategoryId === cat.id}
                <div class="px-2 pb-2 pl-20">
                  <CategoryColorPicker
                    bind:value={colorEditorValue}
                    presets={COLOR_SWATCHES}
                    label={`Color for ${cat.name}`}
                    onselect={(color) => updateCategoryColor(cat, color)}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer: add new -->
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-border-subtle">
      <CategoryColorPicker
        bind:value={newColor}
        presets={COLOR_SWATCHES}
        label="New category color"
        showPreview={false}
      />
      <div class="flex gap-2">
        <Button
          tone="neutral"
          appearance="bare"
          size="icon"
          class="h-9 w-9 flex-shrink-0"
          aria-label="New category color no color"
          aria-pressed={newColor === null}
          onclick={() => { newColor = null; }}
        >
          {#if newColor}
            <span class="h-5 w-5 rounded-full" style="background-color: {newColor}"></span>
          {:else}
            <span class="h-5 w-5 rounded-full border border-dashed border-muted"></span>
          {/if}
        </Button>
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

  {#if pendingDeleteCategory}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        class="w-full max-w-sm rounded-lg bg-surface p-5 shadow-xl"
      >
        <h2 id="delete-category-title" class="text-base font-semibold text-heading">
          Delete category?
        </h2>
        <p class="mt-2 text-sm text-supporting">
          This will <strong class="font-semibold text-danger">delete category {pendingDeleteCategory.name}</strong> from this list.
        </p>
        {#if error}
          <p class="mt-3 text-sm text-danger">{error}</p>
        {/if}
        <div class="mt-5 flex justify-end gap-2">
          <Button tone="neutral" appearance="outline" onclick={cancelDeleteCategory} disabled={isDeletingCategory}>
            Cancel
          </Button>
          <Button
            tone="danger"
            appearance="solid"
            onclick={confirmDeleteCategory}
            loading={isDeletingCategory}
            loadingLabel="Deleting..."
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
