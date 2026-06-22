<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { checkHealth } from '$lib/api/health';

  let mode = $state<'starting' | 'timeout'>('starting');
  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let retries = 0;
  let attemptInFlight = false;
  let destroyed = false;
  const maxRetries = 60;

  function clearPolling() {
    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
      pollInterval = undefined;
    }
  }

  async function handleStartupTick() {
    if (attemptInFlight || destroyed || mode !== 'starting') return;
    attemptInFlight = true;
    try {
      const healthy = await checkHealth();
      if (healthy) {
        await invalidateAll();
        retries++;
        if (!destroyed && retries >= maxRetries) {
          clearPolling();
          mode = 'timeout';
        }
        return;
      }

      retries++;
      if (retries >= maxRetries) {
        clearPolling();
        if (!destroyed) mode = 'timeout';
      }
    } finally {
      attemptInFlight = false;
    }
  }

  onMount(async () => {
    await handleStartupTick();
    if (!destroyed && mode === 'starting') {
      pollInterval = setInterval(() => {
        void handleStartupTick();
      }, 2000);
    }
  });

  onDestroy(() => {
    destroyed = true;
    clearPolling();
  });
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
  {:else}
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
      <p class="text-gray-500 text-sm">Backend did not respond. Please try reloading.</p>
    </div>
  {/if}
</div>
