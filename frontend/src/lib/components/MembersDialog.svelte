<script lang="ts">
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import {
    getMembers,
    addMember,
    changeMemberRole,
    removeMember,
    type MemberDto,
    type ListRole,
  } from '$lib/api/lists';
  import { ApiError } from '$lib/api/client';
  import { friendlyError } from '$lib/api/errors';

  let { listId, onclose }: { listId: string; onclose: () => void } = $props();

  let members = $state<MemberDto[]>([]);
  let loadError = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  let inviteEmail = $state('');
  let inviteRole = $state<ListRole>('EDITOR');
  let inviting = $state(false);

  const currentUser = getCurrentUser();

  const myRole = $derived(
    members.find(m => m.userId === currentUser?.id)?.role ?? null
  );
  const isOwner = $derived(myRole === 'OWNER');

  const roles: ListRole[] = ['OWNER', 'EDITOR', 'VIEWER'];

  async function load() {
    try {
      members = await getMembers(listId);
    } catch (e) {
      loadError = friendlyError(e, 'Failed to load members');
    }
  }

  load();

  async function handleInvite(e: Event) {
    e.preventDefault();
    actionError = null;
    inviting = true;
    try {
      const added = await addMember(listId, { email: inviteEmail, role: inviteRole });
      members = [...members, added];
      inviteEmail = '';
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        actionError = 'This user is already a member.';
      } else if (e instanceof ApiError && e.status === 404) {
        actionError = 'No account found with that email address.';
      } else {
        actionError = friendlyError(e, 'Failed to invite member');
      }
    } finally {
      inviting = false;
    }
  }

  async function handleRoleChange(userId: string, role: ListRole) {
    actionError = null;
    try {
      const updated = await changeMemberRole(listId, userId, { role });
      members = members.map(m => m.userId === userId ? updated : m);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        actionError = 'Cannot change role: this is the sole owner.';
      } else {
        actionError = friendlyError(e, 'Failed to change role');
      }
    }
  }

  async function handleRemove(userId: string) {
    actionError = null;
    try {
      await removeMember(listId, userId);
      members = members.filter(m => m.userId !== userId);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        actionError = 'Cannot remove the sole owner.';
      } else {
        actionError = friendlyError(e, 'Failed to remove member');
      }
    }
  }

  const roleColors: Record<ListRole, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    EDITOR: 'bg-blue-100 text-blue-700',
    VIEWER: 'bg-gray-100 text-gray-600',
  };
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-30 bg-black/40"
  onclick={onclose}
  role="presentation"
></div>

<!-- Dialog -->
<div class="fixed inset-x-4 top-1/2 z-40 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-900">Members</h2>
    <button onclick={onclose} class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
  </div>

  {#if loadError}
    <p class="text-sm text-red-600 mb-4">{loadError}</p>
  {:else}
    <ul class="space-y-2 mb-4">
      {#each members as member (member.userId)}
        <li class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{member.displayName}</p>
            <p class="text-xs text-gray-500 truncate">{member.email}</p>
          </div>
          {#if isOwner && member.userId !== currentUser?.id}
            <select
              value={member.role}
              onchange={(e) => handleRoleChange(member.userId, (e.target as HTMLSelectElement).value as ListRole)}
              class="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {#each roles as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
            <button
              onclick={() => handleRemove(member.userId)}
              class="text-xs text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove {member.displayName}"
            >
              Remove
            </button>
          {:else}
            <span class="text-xs font-medium px-2 py-0.5 rounded-full {roleColors[member.role]}">
              {member.role}
            </span>
          {/if}
        </li>
      {/each}
    </ul>

    {#if actionError}
      <p class="text-sm text-red-600 mb-3">{actionError}</p>
    {/if}

    {#if isOwner}
      <form onsubmit={handleInvite} class="border-t border-gray-100 pt-4 space-y-3">
        <p class="text-sm font-medium text-gray-700">Invite member</p>
        <input
          type="email"
          bind:value={inviteEmail}
          placeholder="Email address"
          required
          class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-2">
          <select
            bind:value={inviteRole}
            class="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each roles as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
          <button
            type="submit"
            disabled={inviting}
            class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {inviting ? 'Inviting…' : 'Add'}
          </button>
        </div>
      </form>
    {/if}
  {/if}
</div>
