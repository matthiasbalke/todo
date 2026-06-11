<script lang="ts">
  import { goto } from '$app/navigation';
  import { getLists, getListGroups, createList, createListGroup, isLoading } from '$lib/stores/lists.svelte';
  import { isDraggingAny } from '$lib/stores/drag.svelte';
  import ListForm from '$lib/components/ListForm.svelte';
  import ListGroupSection from '$lib/components/ListGroupSection.svelte';
  import { friendlyError } from '$lib/api/errors';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  const lists = $derived(getLists());
  const groups = $derived(getListGroups());
  const draggingAny = $derived(isDraggingAny());

  const sortedGroups = $derived(groups.slice().sort((a, b) => a.sortOrder - b.sortOrder));
  const ungroupedLists = $derived(lists.filter(l => l.groupId === null));

  let showAddForm = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let addingGroup = $state(false);
  let newGroupName = $state('');
  let groupError = $state<string | null>(null);
  let groupInput = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (addingGroup) {
      groupInput?.focus();
    }
  });

  async function handleSave({ name, emoji }: { name: string; emoji: string }) {
    saving = true;
    error = null;
    try {
      const created = await createList({ name, emoji });
      showAddForm = false;
      goto(`/lists/${created.id}`);
    } catch (e) {
      error = friendlyError(e, 'Failed to create list');
    } finally {
      saving = false;
    }
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    groupError = null;
    try {
      await createListGroup(newGroupName.trim());
      newGroupName = '';
      addingGroup = false;
    } catch (e) {
      groupError = friendlyError(e, 'Failed to create group');
    }
  }
</script>

<div class="pb-20">
  {#if isLoading()}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="space-y-2">
      {#each sortedGroups as group (group.id)}
        <ListGroupSection
          {group}
          lists={lists.filter(l => l.groupId === group.id)}
        />
      {/each}

      {#if ungroupedLists.length > 0 || draggingAny}
        <ListGroupSection
          group={null}
          lists={ungroupedLists}
        />
      {/if}
    </div>
  {/if}
</div>

<div class="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg">
  <div class="max-w-2xl mx-auto px-4 py-3">
    {#if showAddForm}
      <div class="max-h-[70vh] overflow-y-auto">
        <ListForm
          onsubmit={handleSave}
          oncancel={() => { showAddForm = false; error = null; }}
        />
      </div>
    {:else if addingGroup}
      <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <TextInput
          bind:element={groupInput}
          bind:value={newGroupName}
          placeholder="Group name"
          class="w-full text-sm border-gray-200"
          onkeydown={(e) => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') { addingGroup = false; newGroupName = ''; } }}
        />
        <div class="flex justify-end gap-2 pt-1">
          <Button variant="bare"
            type="button"
            onclick={() => { addingGroup = false; newGroupName = ''; groupError = null; }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </Button>
          <Button variant="bare"
            onclick={handleAddGroup}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </Button>
        </div>
        {#if groupError}
          <p class="text-sm text-red-600">{groupError}</p>
        {/if}
      </div>
    {:else}
      <div class="flex gap-2">
        <Button variant="bare"
          onclick={() => { showAddForm = true; }}
          disabled={saving}
          class="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
        >
          + New list
        </Button>
        <Button variant="bare"
          onclick={() => { addingGroup = true; }}
          class="py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          + New group
        </Button>
      </div>
    {/if}
    {#if error}
      <p class="mt-2 text-sm text-red-600">{error}</p>
    {/if}
  </div>
</div>
