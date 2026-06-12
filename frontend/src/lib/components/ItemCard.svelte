<script lang="ts">
  import type { TodoItem, Category, User } from '$lib/mock-data';
  import { toggleDone, toggleStarred, deleteItem } from '$lib/stores/items.svelte';
  import { friendlyError } from '$lib/api/errors';
  import DueDateChip from './DueDateChip.svelte';
  import RecurrenceIndicator from './RecurrenceIndicator.svelte';
  import { onMount } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import CompletionToggle from './CompletionToggle.svelte';
  import StarToggle from './StarToggle.svelte';
  import SwipeDeleteAction from './SwipeDeleteAction.svelte';

  let { item, categories, users, isDraggable = false }: { item: TodoItem; categories: Category[]; users: User[]; isDraggable?: boolean } = $props();
  const assignedUsers = $derived(users.filter(u => item.assignedUserIds.includes(u.id)));

  const SNAP_OPEN = 80;       // px — resting position that reveals the delete button
  const SNAP_THRESHOLD = 40;  // drag past this → snap open; less → snap closed
  const DELETE_THRESHOLD = 160; // drag past this → delete immediately

  let swipeX = $state(0);
  let snapping = $state(false);
  let opened = $state(false);
  let cardEl = $state<HTMLDivElement | null>(null);

  let startX = 0;
  let startY = 0;
  let direction: 'h' | 'v' | null = null;

  function onTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    direction = null;
    snapping = false;
  }

  function onTouchMove(e: TouchEvent) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (direction === null) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) direction = 'h';
      else if (Math.abs(dy) > 4) direction = 'v';
    }
    if (direction === 'h') {
      const base = opened ? -SNAP_OPEN : 0;
      const raw = base + dx;
      e.preventDefault();
      swipeX = Math.min(0, Math.max(raw, -DELETE_THRESHOLD - 20));
    }
  }

  function onTouchEnd() {
    direction = null;
    if (swipeX < -DELETE_THRESHOLD) {
      handleDelete();
      return;
    }
    if (swipeX < -SNAP_THRESHOLD) {
      snapping = true;
      swipeX = -SNAP_OPEN;
      opened = true;
    } else if (swipeX !== 0 || opened) {
      snapping = true;
      swipeX = 0;
      opened = false;
    }
  }

  async function handleDelete() {
    snapping = true;
    swipeX = 0;
    opened = false;
    try {
      await deleteItem(item.listId, item.id);
    } catch (e) {
      alert(friendlyError(e, 'Failed to delete item'));
    }
  }

  onMount(() => {
    if (!cardEl) return;
    cardEl.addEventListener('touchstart', onTouchStart, { passive: true });
    cardEl.addEventListener('touchmove',  onTouchMove,  { passive: false });
    cardEl.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      cardEl?.removeEventListener('touchstart', onTouchStart);
      cardEl?.removeEventListener('touchmove',  onTouchMove);
      cardEl?.removeEventListener('touchend',   onTouchEnd);
    };
  });

  async function handleDone(e: Event) {
    e.preventDefault();
    try {
      await toggleDone(item.listId, item.id);
    } catch (e) {
      alert(friendlyError(e, 'Failed to update item'));
    }
  }

  async function handleStar(e: Event) {
    e.preventDefault();
    try {
      await toggleStarred(item.listId, item.id);
    } catch (e) {
      alert(friendlyError(e, 'Failed to update item'));
    }
  }
</script>

<div class="relative overflow-hidden rounded-lg" bind:this={cardEl}>
  <!-- Red delete background -->
  <div class="absolute inset-0 flex items-center justify-end" class:invisible={swipeX >= 0 && !snapping}>
    <SwipeDeleteAction onactivate={handleDelete} />
  </div>
  <!-- Sliding card content -->
  <div
    class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors {isDraggable ? 'select-none' : ''}"
    style="transform: translateX({swipeX}px); transition: {snapping ? 'transform 0.2s ease' : 'none'}"
    ontransitionend={() => { snapping = false; }}
  >
    {#if isDraggable}
      <div
        use:dragHandle
        class="flex-shrink-0 flex items-center justify-center w-5 cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-400"
        aria-label="Drag to reorder"
        tabindex="-1"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
          <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
          <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
        </svg>
      </div>
    {/if}
    <CompletionToggle done={item.done} onactivate={handleDone} />

    <a href="/lists/{item.listId}/items/{item.id}" class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <span class="text-sm font-medium text-gray-900 {item.done ? 'line-through text-gray-400' : ''}">
          {item.title}
        </span>
      </div>
      <div class="flex items-center gap-2 mt-1 flex-wrap">
        <DueDateChip dueDate={item.dueDate} />
        <RecurrenceIndicator rule={item.recurrenceRule} />
        {#if item.notes}
          <span class="text-xs text-gray-400 truncate max-w-32">📝 {item.notes}</span>
        {/if}
      </div>
    </a>

    {#each assignedUsers as assignedUser}
      <div
        class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold"
        title={assignedUser.name}
      >
        {assignedUser.name[0].toUpperCase()}
      </div>
    {/each}

    <StarToggle starred={item.starred} onactivate={handleStar} />
  </div>
</div>
