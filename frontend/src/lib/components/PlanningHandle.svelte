<script lang="ts">
  import { dragHandle } from 'svelte-dnd-action';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  let { id, label, disabled = false, onkeydown }: {
    id: string;
    label: string;
    disabled?: boolean;
    onkeydown?: (event: KeyboardEvent) => void;
  } = $props();
  let element = $state<HTMLButtonElement | null>(null);
  $effect(() => {
    if (!element) return;
    const action = dragHandle(element);
    return () => action?.destroy?.();
  });
</script>

<div class="shrink-0 touch-none cursor-grab active:cursor-grabbing">
<Button bind:element {id} {disabled} {onkeydown} aria-label={label}
  tone="neutral" appearance="ghost" size="icon-header">
  <Icon name="drag" size="controlCompact" />
</Button>
</div>
