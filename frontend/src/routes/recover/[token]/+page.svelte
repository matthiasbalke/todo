<script lang="ts">
  import { WebAuthnError } from '@simplewebauthn/browser';
  import { ApiError } from '$lib/api/client';
  import { recoverWithPasskey } from '$lib/api/recovery';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  let { data } = $props();

  let passkeyLabel = $state('');
  let saving = $state(false);
  let success = $state(false);
  let errorMessage = $state('');

  function isBlockedAccountError(error: ApiError): boolean {
    return error.code === 'ACCOUNT_BLOCKED' || /account .*blocked|blocked .*account/i.test(error.message);
  }

  function friendlyError(error: unknown): string {
    if (error instanceof WebAuthnError && error.code === 'ERROR_CEREMONY_ABORTED') return 'Cancelled — try again';
    if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Cancelled — try again';
    if (error instanceof ApiError && error.status === 409 && isBlockedAccountError(error)) return 'This account is blocked. Please contact the admin.';
    if (error instanceof ApiError) return error.message;
    console.error(error);
    return 'Passkey recovery failed — try again';
  }

  async function handleRecover() {
    saving = true;
    errorMessage = '';
    try {
      await recoverWithPasskey(data.token, passkeyLabel.trim() || undefined);
      success = true;
    } catch (error) {
      errorMessage = friendlyError(error);
    } finally {
      saving = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
  <div class="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    {#if success}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Passkey registered</h1>
        <p class="text-sm text-gray-500 mt-2">Your new passkey was added. Sign in with it from the login page.</p>
      </div>
      <a href="/auth" class="block text-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 text-sm font-medium">
        Go to login
      </a>
    {:else}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Recover access</h1>
        <p class="text-sm text-gray-500 mt-2">Register a new passkey for {data.recovery.email}.</p>
      </div>

      {#if errorMessage}
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errorMessage}</div>
      {/if}

      <TextInput id="recovery-passkey-label" bind:value={passkeyLabel} label="Passkey name (optional)" placeholder="e.g. My phone" class="w-full" />
      <Button tone="primary" appearance="solid" size="large" class="w-full" onclick={handleRecover} disabled={saving}>
        {saving ? 'Registering passkey…' : 'Register new passkey'}
      </Button>
    {/if}
  </div>
</div>
