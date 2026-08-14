<script lang="ts">
  import { goto } from '$app/navigation';
  import { WebAuthnError } from '@simplewebauthn/browser';
  import { ApiError } from '$lib/api/client';
  import { setupAdminWithPasskey } from '$lib/api/setup';
  import { setSession } from '$lib/stores/auth.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmailInput from '$lib/components/EmailInput.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  let displayName = $state('');
  let email = $state('');
  let setupSecret = $state('');
  let passkeyLabel = $state('');
  let saving = $state(false);
  let errorMessage = $state('');

  function friendlyError(err: unknown): string {
    if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') return 'Cancelled — try again';
    if (err instanceof DOMException && err.name === 'NotAllowedError') return 'Cancelled — try again';
    if (err instanceof ApiError && err.status === 409) return err.message;
    if (err instanceof ApiError) return err.message;
    console.error(err);
    return 'Setup failed — try again';
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!displayName.trim() || !email.trim() || !setupSecret.trim()) return;
    saving = true;
    errorMessage = '';
    try {
      const result = await setupAdminWithPasskey(email.trim(), displayName.trim(), setupSecret.trim(), passkeyLabel.trim() || undefined);
      setSession(result);
      await goto('/admin');
    } catch (err) {
      errorMessage = friendlyError(err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
  <form onsubmit={handleSubmit} class="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Setup admin</h1>
      <p class="text-sm text-gray-500 mt-1">Create the first admin account for this Todo instance.</p>
    </div>

    {#if errorMessage}
      <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errorMessage}</div>
    {/if}

    <TextInput id="setup-display-name" bind:value={displayName} label="Display name" required class="w-full" />
    <EmailInput id="setup-email" bind:value={email} label="Email" required class="w-full" />
    <TextInput id="setup-secret" bind:value={setupSecret} label="Setup secret" required placeholder="Shown in backend logs" class="w-full" />
    <p class="text-xs text-gray-500 -mt-2">Use the setup secret from the backend logs. This is only needed for first setup.</p>
    <TextInput id="setup-passkey-label" bind:value={passkeyLabel} label="Passkey name (optional)" placeholder="e.g. My laptop" class="w-full" />

    <Button type="submit" tone="primary" appearance="solid" size="large" class="w-full" disabled={saving}>
      {saving ? 'Creating admin…' : 'Create admin passkey'}
    </Button>
  </form>
</div>
