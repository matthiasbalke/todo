<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { checkHealth } from '$lib/api/health';

  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let mode = $state<'starting' | 'timeout'>('starting');

  onMount(async () => {
    let retries = 0;
    const maxRetries = 60;

    async function tryConnect() {
      const healthy = await checkHealth();
      if (healthy) {
        if (pollInterval !== undefined) {
          clearInterval(pollInterval);
          pollInterval = undefined;
        }
        await invalidateAll();
        return;
      }

      retries++;
      if (retries >= maxRetries) {
        if (pollInterval !== undefined) {
          clearInterval(pollInterval);
          pollInterval = undefined;
        }
        mode = 'timeout';
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
