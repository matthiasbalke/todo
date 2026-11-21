<script lang="ts">
  import Button from './Button.svelte';
  import { getProfile } from '$lib/stores/preferences.svelte';
  import { isAgileSelected, isAgileSaving, setAgileSelection } from '$lib/stores/agile.svelte';
  let { itemId }: { itemId: string } = $props();
  let error = $state('');
  async function toggle(event: MouseEvent) {
    event.stopPropagation(); event.preventDefault(); error = '';
    try { await setAgileSelection(itemId, !isAgileSelected(itemId)); }
    catch { error = 'Could not save selection. Please retry.'; }
  }
</script>
{#if getProfile()?.agileViewEnabled}
  <div>
    <Button tone="neutral" appearance="ghost" size="small" aria-label="Plan in Agile" aria-pressed={isAgileSelected(itemId)} disabled={isAgileSaving()} onclick={toggle}>
      {isAgileSelected(itemId) ? '✓ Agile' : '+ Agile'}
    </Button>
    {#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  </div>
{/if}
