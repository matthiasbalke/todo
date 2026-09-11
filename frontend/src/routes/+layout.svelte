<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { appVersion } from '$lib/version';
  import { installThemeHandling } from '$lib/stores/theme.svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children, data } = $props();
  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

  onMount(() => {
    const cleanupTheme = installThemeHandling();
    document.body.setAttribute('data-hydrated', 'true');
    return cleanupTheme;
  });
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<div class="min-h-screen bg-canvas flex flex-col">
  <div class="flex-1 flex flex-col">
    {@render children()}
  </div>
  <footer class="py-4 text-center text-xs text-subdued">
    v{appVersion}{data.buildNumber !== '0' ? `.${data.buildNumber}` : ''}
  </footer>
</div>
