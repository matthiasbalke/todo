<script lang="ts">
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import {
    getMembers,
    getMemberSuggestions,
    addMember,
    changeMemberRole,
    removeMember,
    type MemberDto,
    type MemberSuggestionDto,
    type ListRole,
  } from '$lib/api/lists';
  import { ApiError } from '$lib/api/client';
  import { friendlyError } from '$lib/api/errors';
  import { formatListRole } from '$lib/listRoles';
  import Button from './Button.svelte';
  import MemberInviteEmailInput from './MemberInviteEmailInput.svelte';
  import Select from './Select.svelte';

  let { listId, canManageMembers, onclose }: {
    listId: string;
    canManageMembers: boolean;
    onclose: () => void;
  } = $props();

  let members = $state<MemberDto[]>([]);
  let suggestions = $state<MemberSuggestionDto[]>([]);
  let loadError = $state<string | null>(null);
  let suggestionsError = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  let inviteEmail = $state('');
  let inviteRole = $state<ListRole>('EDITOR');
  let inviting = $state(false);
  const currentUser = getCurrentUser();

  const roles: ListRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
  const inviteSuggestions = $derived.by(() => {
    const memberEmails = new Set(members.map((member) => member.email.toLocaleLowerCase()));
    return suggestions.filter((suggestion) => !memberEmails.has(suggestion.email.toLocaleLowerCase()));
  });

  async function load() {
    try {
      members = await getMembers(listId);
    } catch (e) {
      loadError = friendlyError(e, 'Failed to load members');
      return;
    }

    if (canManageMembers) {
      try {
        suggestions = await getMemberSuggestions(listId);
      } catch (e) {
        suggestions = [];
        suggestionsError = `Suggestions unavailable. ${friendlyError(e, 'Type an email address to invite manually')}`;
      }
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
        actionError = "We couldn't add that member. Check the email address and try again.";
      } else if (e instanceof ApiError && e.status === 429) {
        actionError = 'Too many invite attempts. Please wait before trying again.';
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
    <Button tone="neutral" appearance="bare" size="icon" emphasis="muted" onclick={onclose} aria-label="Close">✕</Button>
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
          {#if canManageMembers && member.userId !== currentUser?.id}
            <Select
              options={roles}
              selected={member.role}
              getOptionLabel={formatListRole}
              onSelect={(role) => handleRoleChange(member.userId, role)}
              size="dense"
            />
            <Button
              tone="danger" appearance="bare"
              size="compact"
              onclick={() => handleRemove(member.userId)}
              aria-label="Remove {member.displayName}"
            >
              Remove
            </Button>
          {:else}
            <span class="text-xs font-medium px-2 py-0.5 rounded-full {roleColors[member.role]}">
              {formatListRole(member.role)}
            </span>
          {/if}
        </li>
      {/each}
    </ul>

    {#if actionError}
      <p class="text-sm text-red-600 mb-3">{actionError}</p>
    {/if}

    {#if canManageMembers}
      <form onsubmit={handleInvite} class="border-t border-gray-100 pt-4 space-y-3">
        <p class="text-sm font-medium text-gray-700">Invite member</p>
        {#if suggestionsError}
          <p class="text-xs text-amber-700">{suggestionsError}</p>
        {/if}
        <MemberInviteEmailInput
          bind:value={inviteEmail}
          suggestions={inviteSuggestions}
          placeholder="Email address"
          required
          label=""
          class="w-full"
        />
        <div class="flex gap-2">
          <Select
            options={roles}
            selected={inviteRole}
            getOptionLabel={formatListRole}
            onSelect={(role) => { inviteRole = role; }}
            size="default"
          />
          <Button
            type="submit"
            loading={inviting}
            loadingLabel="Inviting…"
            class="flex-1"
          >
            Add
          </Button>
        </div>
      </form>
    {/if}
  {/if}
</div>
