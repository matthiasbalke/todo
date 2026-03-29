<script lang="ts">
  import { untrack } from 'svelte';

  let {
    list,
    onsubmit,
    oncancel
  }: {
    list?: { name: string; emoji: string | null } | null;
    onsubmit: (data: { name: string; emoji: string }) => void;
    oncancel: () => void;
  } = $props();

  const isNew = $derived(!list);

  let name = $state(untrack(() => list ? `${list.emoji ?? ''}${list.emoji ? ' ' : ''}${list.name}` : ''));

  function extractEmoji(str: string): string {
    const match = str.match(/^\p{Emoji_Presentation}/u);
    return match ? match[0] : '';
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = name.trim();
    const emoji = extractEmoji(trimmed);
    const displayName = emoji ? trimmed.slice(emoji.length).trimStart() : trimmed;
    onsubmit({ name: displayName || trimmed, emoji: emoji || '📋' });
  }
</script>

<form onsubmit={handleSubmit} class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <input
    type="text"
    bind:value={name}
    onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
    placeholder="List name"
    required
    class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  <div class="flex justify-end gap-2 pt-1">
    <button
      type="button"
      onclick={oncancel}
      class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {isNew ? 'Create' : 'Save'}
    </button>
  </div>
</form>
