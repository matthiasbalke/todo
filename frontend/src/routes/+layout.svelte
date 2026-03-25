<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  let { children } = $props();
  onMount(() => { document.body.dataset.hydrated = 'true'; });
</script>
{@render children()}
