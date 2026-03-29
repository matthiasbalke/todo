<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { appVersion } from '$lib/version';
  import { getBackendVersion } from '$lib/api/health';

  let { children, data } = $props();

  let backendVersion = $state<string | null>(null);
  let fetchDone = $state(false);

  onMount(async () => {
    document.body.dataset.hydrated = 'true';
    backendVersion = await getBackendVersion();
    fetchDone = true;
  });
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <div class="flex-1 flex flex-col">
    {@render children()}
  </div>
  <footer class="py-4 text-center text-xs text-gray-400">
    frontend v{appVersion}{data.buildNumber !== '0' ? `.${data.buildNumber}` : ''}
    {#if backendVersion}
      · backend v{backendVersion}
    {:else if !fetchDone}
      · backend …
    {/if}
  </footer>
</div>
