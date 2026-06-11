<script lang="ts">
  import { untrack } from 'svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { startRegistration, WebAuthnError } from '@simplewebauthn/browser';
  import {
    updateMe,
    getPasskeys,
    getAddPasskeyOptions,
    submitAddPasskey,
    deletePasskey,
    getDeletionPreview,
    deleteAccount,
    type PasskeyDto,
    type DeletionPreviewDto,
  } from '$lib/api/users';
  import { updateCurrentUser, clearSession } from '$lib/stores/auth.svelte';
  import { friendlyError } from '$lib/api/errors';
  import { ApiError } from '$lib/api/client';
  import Button from '$lib/components/Button.svelte';
  import EditableLabel from '$lib/components/EditableLabel.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  let { data }: { data: PageData } = $props();

  let profile = $state(untrack(() => ({ ...data.profile })));
  let passkeys = $state<PasskeyDto[]>(untrack(() => [...data.passkeys]));

  // ─── Display name ─────────────────────────────────────────────────────────
  let editingName = $state(false);
  let nameEdit = $state('');
  let nameSaving = $state(false);
  let nameError = $state('');
  let nameInput = $state<HTMLInputElement | null>(null);
  $effect(() => { if (editingName) nameInput?.focus(); });

  function startEditName() {
    nameEdit = profile.displayName;
    nameError = '';
    editingName = true;
  }

  async function saveDisplayName() {
    const trimmed = nameEdit.trim();
    if (!trimmed) { editingName = false; return; }
    nameSaving = true;
    nameError = '';
    try {
      const updated = await updateMe({ displayName: trimmed, email: profile.email });
      profile = { ...profile, displayName: updated.displayName };
      updateCurrentUser({ displayName: updated.displayName });
      editingName = false;
    } catch (e) {
      nameError = friendlyError(e, 'Failed to save display name');
    } finally {
      nameSaving = false;
    }
  }

  // ─── Email ────────────────────────────────────────────────────────────────
  let emailEdit = $state(untrack(() => profile.email));
  let emailSaving = $state(false);
  let emailError = $state('');
  let emailSuccess = $state(false);
  let editingEmail = $state(false);
  let emailInput = $state<HTMLInputElement | null>(null);
  let ignoreNextEmailFocusOut = false;
  $effect(() => { if (editingEmail && emailInput) emailInput.focus(); });

  function startEditEmail() {
    emailEdit = profile.email;
    emailError = '';
    emailSuccess = false;
    editingEmail = true;
  }

  async function saveEmail() {
    emailSaving = true;
    emailError = '';
    emailSuccess = false;
    try {
      const updated = await updateMe({ displayName: profile.displayName, email: emailEdit.trim() });
      profile = { ...profile, email: updated.email };
      updateCurrentUser({ email: updated.email });
      emailSuccess = true;
      editingEmail = false;
    } catch (e) {
      emailError = friendlyError(e, 'Failed to save email');
    } finally {
      emailSaving = false;
    }
  }

  // ─── Add passkey ──────────────────────────────────────────────────────────
  let showAddPasskey = $state(false);
  let newLabel = $state('');
  let addingPasskey = $state(false);
  let addPasskeyError = $state('');

  async function handleAddPasskey() {
    addingPasskey = true;
    addPasskeyError = '';
    try {
      const options = await getAddPasskeyOptions();
      const credential = await startRegistration({ optionsJSON: options });
      const passkey = await submitAddPasskey(credential, newLabel.trim() || undefined);
      passkeys = [...passkeys, passkey];
      showAddPasskey = false;
      newLabel = '';
    } catch (e) {
      console.error('[addPasskey]', e);
      if (e instanceof WebAuthnError && e.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
        addPasskeyError = 'This passkey is already registered on this device. Try a different authenticator or device.';
      } else if (e instanceof WebAuthnError && e.code === 'ERROR_CEREMONY_ABORTED') {
        addPasskeyError = 'Cancelled — try again';
      } else if (e instanceof WebAuthnError && (e.code === 'ERROR_INVALID_DOMAIN' || e.code === 'ERROR_INVALID_RP_ID')) {
        addPasskeyError = 'Passkey origin mismatch — check server configuration';
      } else if (e instanceof ApiError && e.code === 'SESSION_EXPIRED') {
        addPasskeyError = 'Session expired — please try again';
      } else if (e instanceof ApiError && e.code === 'REGISTRATION_FAILED') {
        addPasskeyError = e.message;
      } else {
        addPasskeyError = friendlyError(e, 'Failed to add passkey');
      }
    } finally {
      addingPasskey = false;
    }
  }

  // ─── Remove passkey ───────────────────────────────────────────────────────
  let passkeyToRemove = $state<string | null>(null);
  let removingPasskey = $state(false);
  let removePasskeyError = $state('');

  function startRemovePasskey(id: string) {
    passkeyToRemove = id;
    removePasskeyError = '';
  }

  async function confirmRemovePasskey() {
    if (!passkeyToRemove) return;
    removingPasskey = true;
    removePasskeyError = '';
    try {
      await deletePasskey(passkeyToRemove);
      passkeys = passkeys.filter(p => p.id !== passkeyToRemove);
      passkeyToRemove = null;
    } catch (e) {
      removePasskeyError = friendlyError(e, 'Failed to remove passkey');
    } finally {
      removingPasskey = false;
    }
  }

  // ─── Delete account ───────────────────────────────────────────────────────
  let showDeleteConfirm = $state(false);
  let deletionPreview = $state<DeletionPreviewDto | null>(null);
  let loadingPreview = $state(false);
  let deleting = $state(false);
  let deleteError = $state('');

  async function openDeleteConfirm() {
    showDeleteConfirm = true;
    loadingPreview = true;
    deletionPreview = null;
    deleteError = '';
    try {
      deletionPreview = await getDeletionPreview();
    } catch (e) {
      deleteError = friendlyError(e, 'Failed to load deletion preview');
    } finally {
      loadingPreview = false;
    }
  }

  async function confirmDelete() {
    deleting = true;
    deleteError = '';
    try {
      await deleteAccount();
      clearSession();
      goto('/deleted');
    } catch (e) {
      deleteError = friendlyError(e, 'Failed to delete account');
      deleting = false;
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<div class="space-y-8">
  <div class="flex items-center gap-3">
    <a href="/lists" class="text-gray-400 hover:text-gray-600">←</a>
    <h1 class="text-xl font-bold text-gray-900">Account</h1>
  </div>

  <!-- Profile section -->
  <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Profile</h2>

    <!-- Display name -->
    <div>
      <p class="block text-sm font-medium text-gray-700 mb-1">Display name</p>
      <EditableLabel
        value={profile.displayName}
        ariaLabel={profile.displayName}
        isSaving={nameSaving}
        inputClass="py-1.5 text-sm"
        displayClass="px-0 py-0 text-sm text-gray-900 hover:opacity-70"
        on:change={(event) => {
          nameEdit = event.detail.value;
          saveDisplayName();
        }}
      />
      {#if nameError}
        <p class="mt-1 text-xs text-red-600">{nameError}</p>
      {/if}
    </div>

    <!-- Email -->
    <div>
      <p class="block text-sm font-medium text-gray-700 mb-1">Email</p>
      <EditableLabel
        id="email"
        type="email"
        value={profile.email}
        ariaLabel={profile.email}
        saveMode="explicit"
        showCancel
        isSaving={emailSaving}
        inputClass="py-1.5 text-sm"
        displayClass="px-0 py-0 text-sm text-gray-900 hover:opacity-70"
        oncancel={() => { emailEdit = profile.email; }}
        on:change={(event) => {
          emailEdit = event.detail.value;
          saveEmail();
        }}
      />
      {#if emailError}
        <p class="mt-1 text-xs text-red-600">{emailError}</p>
      {/if}
      {#if emailSuccess}
        <p class="mt-1 text-xs text-green-600">Email updated.</p>
      {/if}
    </div>
  </section>

  <!-- Security section -->
  <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Security</h2>

    <ul class="space-y-2">
      {#each passkeys as passkey (passkey.id)}
        <li class="py-2 border-b border-gray-100 last:border-0">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-800">{passkey.label ?? 'Passkey'}</p>
              <p class="text-xs text-gray-400">Added {formatDate(passkey.createdAt)}</p>
            </div>
            {#if passkeyToRemove !== passkey.id}
              <Button variant="bare"
                onclick={() => startRemovePasskey(passkey.id)}
                disabled={passkeys.length <= 1}
                title={passkeys.length <= 1 ? "Can't remove the last passkey" : 'Remove passkey'}
                class="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Remove
              </Button>
            {/if}
          </div>
          {#if passkeyToRemove === passkey.id}
            <div class="mt-3 space-y-3">
              <p class="text-sm font-medium text-gray-800">Remove <span class="font-semibold">"{passkey.label ?? 'Passkey'}"</span>? This can't be undone.</p>
              {#if removePasskeyError}
                <p class="text-sm text-red-600">{removePasskeyError}</p>
              {/if}
              <div class="flex items-center gap-3">
                <Button variant="bare"
                  onclick={confirmRemovePasskey}
                  disabled={removingPasskey}
                  class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {removingPasskey ? 'Removing…' : 'Confirm removal'}
                </Button>
                <Button variant="secondary"
                  onclick={() => (passkeyToRemove = null)}
                  class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          {/if}
        </li>
      {/each}
      {#if passkeys.length === 0}
        <li class="text-sm text-gray-400 py-2">No passkeys registered.</li>
      {/if}
    </ul>

    {#if showAddPasskey}
      <div class="border border-gray-200 rounded-lg p-4 space-y-3">
        <p class="text-sm font-medium text-gray-700">Add passkey for this device</p>
        <TextInput
          bind:value={newLabel}
          placeholder="Label (optional, e.g. My Laptop)"
          class="w-full border-gray-300 py-1.5 text-sm focus:border-blue-500"
        />
        {#if addPasskeyError}
          <p class="text-xs text-red-600">{addPasskeyError}</p>
        {/if}
        <div class="flex gap-2">
          <Button variant="primary"
            onclick={handleAddPasskey}
            disabled={addingPasskey}
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {addingPasskey ? 'Adding…' : 'Add passkey'}
          </Button>
          <Button variant="secondary"
            onclick={() => { showAddPasskey = false; newLabel = ''; addPasskeyError = ''; }}
            class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </Button>
        </div>
      </div>
    {:else}
      <Button variant="secondary"
        onclick={() => (showAddPasskey = true)}
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        + Add passkey for this device
      </Button>
    {/if}
  </section>

  <!-- Danger zone -->
  <section class="bg-white rounded-xl border border-red-200 p-6 space-y-4">
    <h2 class="text-sm font-semibold text-red-500 uppercase tracking-wide">Danger zone</h2>

    {#if !showDeleteConfirm}
      <Button variant="danger"
        onclick={openDeleteConfirm}
      >
        Delete my account
      </Button>
    {:else}
      <div class="space-y-4">
        {#if loadingPreview}
          <p class="text-sm text-gray-500">Loading…</p>
        {:else if deleteError}
          <p class="text-sm text-red-600">{deleteError}</p>
        {:else if deletionPreview}
          <p class="text-sm font-medium text-gray-800">This will permanently delete your account.</p>

          {#if deletionPreview.listsToDelete.length > 0}
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Lists that will be deleted</p>
              <ul class="text-sm text-gray-700 space-y-0.5">
                {#each deletionPreview.listsToDelete as l}
                  <li class="text-red-700">— {l.name}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if deletionPreview.listsToLeave.length > 0}
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Lists you will be removed from</p>
              <ul class="text-sm text-gray-700 space-y-0.5">
                {#each deletionPreview.listsToLeave as l}
                  <li>— {l.name}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if deleteError}
            <p class="text-sm text-red-600">{deleteError}</p>
          {/if}

          <div class="flex items-center gap-3">
            <Button variant="bare"
              onclick={confirmDelete}
              disabled={deleting}
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Confirm deletion'}
            </Button>
            <Button variant="bare"
              onclick={() => (showDeleteConfirm = false)}
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Button>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</div>
