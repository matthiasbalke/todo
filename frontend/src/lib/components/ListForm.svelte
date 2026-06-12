<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import { extractEmoji } from '$lib/utils/emoji';
  import Button from './Button.svelte';
  import TextInput from './TextInput.svelte';

  let {
    list,
    onsubmit,
    oncancel
  }: {
    list?: { name: string; emoji: string | null } | null;
    onsubmit: (data: { name: string; emoji: string }) => Promise<void> | void;
    oncancel: () => void;
  } = $props();

  const isNew = $derived(!list);

  let name = $state(untrack(() => list ? `${list.emoji ?? ''}${list.emoji ? ' ' : ''}${list.name}` : ''));
  let nameInput = $state<HTMLInputElement | null>(null);

  onMount(() => nameInput?.focus());

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = name.trim();
    const emoji = extractEmoji(trimmed);
    const displayName = emoji ? trimmed.slice(emoji.length).trimStart() : trimmed;
    await onsubmit({ name: displayName || trimmed, emoji: emoji || '📋' });
  }
</script>

<form onsubmit={handleSubmit} class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <TextInput
    bind:element={nameInput}
    bind:value={name}
    onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
    placeholder="List name"
    required
    class="w-full"
  />

  <div class="flex justify-end gap-2 pt-1">
    <Button
      type="button"
      tone="neutral" appearance="bare"
      onclick={oncancel}
      emphasis="muted"
    >
      Cancel
    </Button>
    <Button
      type="submit"
    >
      {isNew ? 'Create' : 'Save'}
    </Button>
  </div>
</form>
