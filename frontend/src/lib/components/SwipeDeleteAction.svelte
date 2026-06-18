<script lang="ts">
	import Button from './Button.svelte';

	type Width = 'default' | 'wide';

	interface Props {
		label?: string;
		width?: Width;
		fillHeight?: boolean;
		disabled?: boolean;
		onactivate?: () => void;
	}

	let {
		label = 'Delete item',
		width = 'default',
		fillHeight = true,
		disabled = false,
		onactivate
	}: Props = $props();

	const geometryClasses = $derived(
		`${width === 'wide' ? 'w-24' : 'w-20'} ${fillHeight ? 'h-full' : ''}`
	);
</script>

<Button
	tone="danger"
	appearance="solid"
	size="backdrop"
	class={geometryClasses}
	aria-label={label}
	{disabled}
	onclick={() => onactivate?.()}
>
	<span class="text-lg text-white" aria-hidden="true">🗑</span>
</Button>
