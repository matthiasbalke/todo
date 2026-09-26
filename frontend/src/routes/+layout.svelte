<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { installThemeHandling } from '$lib/stores/theme.svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children } = $props();
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
</div>
