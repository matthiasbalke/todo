<script lang="ts">
  import type { List } from '$lib/mock-data';
  import { mockUsers } from '$lib/mock-data';

  let {
    list,
    onsubmit,
    oncancel
  }: {
    list?: List | null;
    onsubmit: (list: List) => void;
    oncancel: () => void;
  } = $props();

  const isNew = !list;

  let emoji = $state(list?.emoji ?? '');
  let name = $state(list?.name ?? '');

  function handleSubmit(e: Event) {
    e.preventDefault();
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const submitted: List = {
      id: list?.id ?? `${slug}-${(crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`,
      name: name.trim(),
      emoji: emoji.trim() || '📋',
      sortField: list?.sortField ?? 'MANUAL',
      sortDirection: list?.sortDirection ?? 'ASC',
      ownerId: list?.ownerId ?? mockUsers[0].id
    };
    onsubmit(submitted);
  }
</script>

<form onsubmit={handleSubmit} class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={emoji}
      maxlength="2"
      placeholder="📋"
      class="w-14 text-center text-lg border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      type="text"
      bind:value={name}
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
      placeholder="List name"
      required
      class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

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
