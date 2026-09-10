<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createRecoveryLink,
    setRegistrationEnabled,
    updateAdminUser,
    updateUserAdmin,
    updateUserBlocked,
    type AdminUser,
    type RecoveryLink,
  } from '$lib/api/admin';
  import { ApiError } from '$lib/api/client';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import Toggle from '$lib/components/Toggle.svelte';

  let { data } = $props();

  type EditableUser = AdminUser & {
    editDisplayName: string;
    editEmail: string;
    saving: boolean;
    error: string;
  };

  let registrationEnabled = $state(untrack(() => data.settings.registrationEnabled));
  let settingsMessage = $state('');
  let settingsError = $state('');
  let users = $state<EditableUser[]>(untrack(() => data.users.map((user: AdminUser) => ({
    ...user,
    editDisplayName: user.displayName,
    editEmail: user.email,
    saving: false,
    error: '',
  }))));
  let recoveryLinks = $state<Record<string, RecoveryLink>>({});

  function friendlyError(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    console.error(error);
    return fallback;
  }

  function replaceUser(updated: AdminUser) {
    users = users.map((user) => user.id === updated.id
      ? { ...user, ...updated, editDisplayName: updated.displayName, editEmail: updated.email, saving: false, error: '' }
      : user
    );
  }

  async function saveRegistration(enabled: boolean) {
    registrationEnabled = enabled;
    settingsMessage = '';
    settingsError = '';
    try {
      const updated = await setRegistrationEnabled(enabled);
      registrationEnabled = updated.registrationEnabled;
      settingsMessage = 'Registration setting saved.';
    } catch (error) {
      registrationEnabled = !enabled;
      settingsError = friendlyError(error, 'Failed to save registration setting');
    }
  }

  async function saveProfile(user: EditableUser) {
    user.saving = true;
    user.error = '';
    try {
      replaceUser(await updateAdminUser(user.id, {
        displayName: user.editDisplayName.trim(),
        email: user.editEmail.trim(),
      }));
    } catch (error) {
      user.saving = false;
      user.error = friendlyError(error, 'Failed to update user');
    }
  }

  async function setAdmin(user: EditableUser, admin: boolean) {
    user.error = '';
    try {
      replaceUser(await updateUserAdmin(user.id, admin));
    } catch (error) {
      user.error = friendlyError(error, 'Failed to update admin state');
    }
  }

  async function setBlocked(user: EditableUser, blocked: boolean) {
    user.error = '';
    try {
      replaceUser(await updateUserBlocked(user.id, blocked));
    } catch (error) {
      user.error = friendlyError(error, 'Failed to update blocked state');
    }
  }

  async function createRecovery(user: EditableUser) {
    user.error = '';
    try {
      recoveryLinks = { ...recoveryLinks, [user.id]: await createRecoveryLink(user.id) };
    } catch (error) {
      user.error = friendlyError(error, 'Failed to create recovery link');
    }
  }
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-heading">Admin</h1>
    <p class="text-sm text-muted mt-1">Manage this Todo instance.</p>
  </div>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Settings</h2>
    <div class="flex items-center justify-between border border-border rounded-lg p-4">
      <div>
        <p class="text-sm font-medium text-heading">Registration</p>
        <p class="text-sm text-muted">Allow new account creation.</p>
      </div>
      <Toggle checked={registrationEnabled} ariaLabel="Registration enabled" onchange={saveRegistration} />
    </div>
    {#if settingsMessage}<p class="text-sm text-success-strong">{settingsMessage}</p>{/if}
    {#if settingsError}<p class="text-sm text-danger-strong">{settingsError}</p>{/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Usage</h2>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Users</p><p class="text-xl font-semibold">{data.stats.users}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Admins</p><p class="text-xl font-semibold">{data.stats.admins}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Blocked</p><p class="text-xl font-semibold">{data.stats.blockedUsers}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Lists</p><p class="text-xl font-semibold">{data.stats.lists}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Items</p><p class="text-xl font-semibold">{data.stats.todoItems}</p></div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Users</h2>
    <div class="space-y-3">
      {#each users as user (user.id)}
        <div class="border border-border rounded-lg p-4 space-y-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <TextInput bind:value={user.editDisplayName} label="Display name" class="w-full" />
            <TextInput bind:value={user.editEmail} label="Email" type="email" class="w-full" />
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <label class="flex items-center gap-2">
              <Toggle checked={user.admin} ariaLabel="Admin {user.email}" onchange={(checked) => setAdmin(user, checked)} />
              Admin
            </label>
            <label class="flex items-center gap-2">
              <Toggle checked={user.blocked} ariaLabel="Blocked {user.email}" onchange={(checked) => setBlocked(user, checked)} />
              Blocked
            </label>
            <span class="text-muted">{user.passkeyCount} passkey{user.passkeyCount === 1 ? '' : 's'}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button tone="primary" appearance="solid" size="small" onclick={() => saveProfile(user)} disabled={user.saving}>
              {user.saving ? 'Saving…' : 'Save profile'}
            </Button>
            <Button tone="neutral" appearance="outline" size="small" onclick={() => createRecovery(user)} disabled={user.blocked}>
              Create recovery link
            </Button>
          </div>
          {#if recoveryLinks[user.id]}
            <div class="bg-warning-surface border border-warning-soft rounded p-3 text-sm text-warning-heading break-all">
              <p class="font-medium mb-1">Secret recovery URL, expires {new Date(recoveryLinks[user.id].expiresAt).toLocaleString()}</p>
              <p>{recoveryLinks[user.id].url}</p>
            </div>
          {/if}
          {#if user.error}<p class="text-sm text-danger-strong">{user.error}</p>{/if}
        </div>
      {/each}
    </div>
  </section>
</div>
