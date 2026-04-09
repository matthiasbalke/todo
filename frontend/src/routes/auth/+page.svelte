<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { WebAuthnError } from '@simplewebauthn/browser';
  import { ApiError, getAuthConfig, loginWithPasskey, registerWithPasskey } from '$lib/api/auth';
  import { checkHealth } from '$lib/api/health';
  import { setSession } from '$lib/stores/auth.svelte';

  type Mode = 'starting' | 'idle' | 'register-form' | 'signing-in' | 'registering' | 'error' | 'startup-timeout';

  let mode = $state<Mode>('starting');
  let errorMessage = $state('');
  let email = $state('');
  let displayName = $state('');
  let registrationEnabled = $state(true);

  let pollInterval: ReturnType<typeof setInterval> | undefined;

  onMount(async () => {
    let retries = 0;
    const maxRetries = 60;

    async function tryConnect() {
      const healthy = await checkHealth();
      if (healthy) {
        clearInterval(pollInterval);
        pollInterval = undefined;
        try {
          const config = await getAuthConfig();
          registrationEnabled = config.registrationEnabled;
        } catch {
          // default to true if config fetch fails — backend will enforce the real value
        }
        mode = 'idle';
      } else {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(pollInterval);
          pollInterval = undefined;
          mode = 'startup-timeout';
        }
      }
    }

    await tryConnect();
    if (mode === 'starting') {
      pollInterval = setInterval(tryConnect, 2000);
    }
  });

  onDestroy(() => {
    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }
  });

  function passkeyErrorMessage(err: unknown): string {
    if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') return 'Cancelled — try again';
    if (err instanceof WebAuthnError && (err.code === 'ERROR_INVALID_DOMAIN' || err.code === 'ERROR_INVALID_RP_ID')) return 'Passkey origin not allowed — check the server configuration';
    if (err instanceof ApiError && err.status === 403 && err.code === 'REGISTRATION_DISABLED') return 'Registration is currently disabled';
    if (err instanceof ApiError && err.status === 403) return 'Passkey origin not allowed — check the server configuration';
    if (err instanceof ApiError && err.status === 409) return err.message;
    if (err instanceof ApiError && err.status === 429) return 'Too many attempts — please wait a moment';
    if (err instanceof ApiError && err.status === 404) return registrationEnabled ? err.message : 'This passkey is not registered';

    // log unspecific errors to console
    console.error(err);

    return 'Something went wrong — try again';
  }

  async function handleSignIn() {
    mode = 'signing-in';
    errorMessage = '';
    try {
      const result = await loginWithPasskey();
      setSession(result);
      await goto('/lists');
    } catch (err) {
      mode = 'error';
      errorMessage = passkeyErrorMessage(err);
    }
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;
    mode = 'registering';
    errorMessage = '';
    try {
      const result = await registerWithPasskey(email.trim(), displayName.trim());
      setSession(result);
      await goto('/lists');
    } catch (err) {
      mode = 'error';
      errorMessage = passkeyErrorMessage(err);
    }
  }

  function showRegisterForm() {
    mode = 'register-form';
    errorMessage = '';
  }

  function resetToIdle() {
    mode = 'idle';
    errorMessage = '';
  }
</script>

<div class="flex-1 flex items-center justify-center p-4">
  {#if mode === 'starting'}
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4">
      <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="text-gray-500 text-sm">Application is starting…</p>
    </div>
  {:else if mode === 'startup-timeout'}
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
      <p class="text-gray-500 text-sm">Backend did not respond. Please try reloading.</p>
    </div>
  {:else}
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
      <p class="text-gray-500 text-sm mb-6">{registrationEnabled ? 'Sign in or create an account' : 'Sign in'}</p>

      {#if errorMessage}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      {/if}

      {#if mode === 'register-form' || mode === 'registering' || mode === 'error'}
        <form onsubmit={handleRegister} class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block" for="displayName">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              placeholder="Your name"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block" for="email">Email</label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={mode === 'registering'}
            class="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {#if mode === 'registering'}
              <span>Creating account…</span>
            {:else}
              <span>🔑</span>
              <span>Register passkey</span>
            {/if}
          </button>

          <button
            type="button"
            onclick={resetToIdle}
            class="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
          >
            Back
          </button>
        </form>
      {:else}
        <div class="space-y-3">
          <button
            type="button"
            onclick={handleSignIn}
            disabled={mode === 'signing-in'}
            class="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {#if mode === 'signing-in'}
              <span>Waiting for passkey…</span>
            {:else}
              <span>🔑</span>
              <span>Sign in with Passkey</span>
            {/if}
          </button>

          {#if registrationEnabled}
            <div class="relative my-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
              </div>
              <div class="relative flex justify-center text-xs text-gray-400">
                <span class="bg-white px-2">or</span>
              </div>
            </div>

            <button
              type="button"
              onclick={showRegisterForm}
              class="w-full border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Create account
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
