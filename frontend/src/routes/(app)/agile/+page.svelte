<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { dragHandleZone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { withDragAutoScrollOptions } from '$lib/dndOptions';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import { getAgileEntries, isAgileLoading, isAgileSaving, getAgileError, refreshAgile, saveAgileOrder } from '$lib/stores/agile.svelte';
  import { todayDtoToItem } from '$lib/stores/today.svelte';
  import type { AgileItemDto } from '$lib/api/agile';
  import PlanningHandle from '$lib/components/PlanningHandle.svelte';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import Button from '$lib/components/Button.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { getListCapabilities } from '$lib/listCapabilities';

  const entries = $derived(getAgileEntries());
  let dndItems = $state<AgileItemDto[]>([]);
  let dragging = $state(false);
  let announcement = $state('');
  let hideChecked = $state(false);
  let preferenceOwner = $state('');
  $effect(() => {
    const id = getCurrentUser()?.id ?? '';
    if (id !== preferenceOwner) {
      preferenceOwner = id;
      try { hideChecked = localStorage.getItem(`agile:${id}:hideChecked`) === 'true'; } catch { hideChecked = false; }
    }
  });
  function changeHideChecked(value: boolean) {
    hideChecked = value;
    try { localStorage.setItem(`agile:${preferenceOwner}:hideChecked`, String(value)); } catch { /* Storage may be unavailable. */ }
  }
  $effect(() => {
    const profile = getProfile();
    if (profile && !profile.agileViewEnabled) void goto('/lists');
    else if (profile?.agileViewEnabled) untrack(() => { void refreshAgile().catch(() => {}); });
  });
  $effect(() => { if (!dragging) dndItems = entries.filter(e => !e.done); });

  async function persist(items: AgileItemDto[], focusId?: string) {
    dragging = false;
    dndItems = items;
    announcement = 'Saving planning order…';
    try {
      await saveAgileOrder(items.map(e => e.id));
      announcement = 'Planning order saved.';
    } catch { announcement = 'Order could not be saved. Please retry.'; }
    dndItems = getAgileEntries().filter(e => !e.done);
    if (focusId) { await tick(); document.getElementById(`planning-${focusId}`)?.focus(); }
  }
  function consider(event: CustomEvent<{ items: AgileItemDto[] }>) {
    dragging = true; dndItems = event.detail.items;
  }
  function finalize(event: CustomEvent<{ items: AgileItemDto[] }>) {
    void persist(event.detail.items.filter(e => !(e as unknown as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]));
  }
  function move(id: string, delta: number) {
    if (isAgileSaving()) return;
    const next = [...dndItems], index = next.findIndex(e => e.id === id), target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next, id);
  }
  function keyboard(event: KeyboardEvent, id: string) {
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault(); event.stopPropagation(); move(id, event.key === 'ArrowUp' ? -1 : 1);
    }
  }
</script>

<div class="space-y-5">
  <div class="flex items-center gap-3">
    <a href="/lists" aria-label="Back to lists" class="inline-flex h-11 w-11 items-center justify-center text-muted"><Icon name="back" size="header" /></a>
    <h1 class="text-xl font-bold text-heading">📌 Agile</h1>
    <label class="ml-auto flex min-h-11 items-center gap-2 text-sm text-label">
      <input type="checkbox" checked={hideChecked} onchange={e => changeHideChecked(e.currentTarget.checked)} /> Hide checked
    </label>
  </div>
  <p class="text-sm text-muted">Your personal plan across lists. Drag a handle or use Alt + arrow keys to move unfinished items.</p>
  <p class="sr-only" role="status" aria-live="polite">{announcement}</p>
  {#if getAgileError()}
    <div role="alert" class="text-danger">{getAgileError()} <Button tone="neutral" appearance="ghost" size="small" onclick={() => refreshAgile().catch(() => {})}>Retry</Button></div>
  {/if}
  {#if isAgileLoading() && entries.length === 0}
    <p class="py-12 text-center text-subdued">Loading…</p>
  {:else if entries.length === 0}
    <p class="py-12 text-center text-subdued">Your plan is empty. Select “Agile” on items in your lists to plan them here.</p>
  {/if}
  <div use:dragHandleZone={withDragAutoScrollOptions({ items: dndItems, type: 'agile-planning', flipDurationMs: 150, dragDisabled: isAgileSaving(), delayTouchStart: 150 })}
    onconsider={consider} onfinalize={finalize} class="space-y-3" aria-label="Unfinished Agile items">
    {#each dndItems as entry, index (entry.id)}
      <div class="rounded-xl border border-border p-3" data-agile-id={entry.id}>
        <div class="mb-2 flex items-center gap-2">
          <PlanningHandle id="planning-{entry.id}" label="Move {entry.title}" disabled={isAgileSaving()} onkeydown={e => keyboard(e, entry.id)} />
          <a href="/lists/{entry.listId}" class="min-w-0 flex-1 truncate text-sm text-muted">{entry.sourceListEmoji ?? '📋'} {entry.sourceListName}</a>
          <Button tone="neutral" appearance="ghost" size="small" aria-label="Move {entry.title} up" disabled={index === 0 || isAgileSaving()} onclick={() => move(entry.id, -1)}>↑</Button>
          <Button tone="neutral" appearance="ghost" size="small" aria-label="Move {entry.title} down" disabled={index === dndItems.length - 1 || isAgileSaving()} onclick={() => move(entry.id, 1)}>↓</Button>
        </div>
        <ItemCard item={todayDtoToItem(entry)} categories={[]} users={entry.assignedUsers.map(u => ({ id: u.id, name: u.displayName, email: '' }))} editable={getListCapabilities(entry.sourceListRole).canEditItems} returnTo="/agile" onchanged={refreshAgile} />
      </div>
    {/each}
  </div>
  {#if !hideChecked && entries.some(e => e.done)}
    <section aria-label="Checked Agile items" class="space-y-3">
      <h2 class="font-semibold text-heading">Checked</h2>
      {#each entries.filter(e => e.done) as entry (entry.id)}
        <div class="rounded-xl border border-border p-3" data-agile-id={entry.id}>
          <a href="/lists/{entry.listId}" class="mb-2 block text-sm text-muted">{entry.sourceListEmoji ?? '📋'} {entry.sourceListName}</a>
          <ItemCard item={todayDtoToItem(entry)} categories={[]} users={entry.assignedUsers.map(u => ({ id: u.id, name: u.displayName, email: '' }))} editable={getListCapabilities(entry.sourceListRole).canEditItems} returnTo="/agile" onchanged={refreshAgile} />
        </div>
      {/each}
    </section>
  {/if}
</div>
