<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props {
		color: string;
		selected?: boolean;
		label?: string;
		disabled?: boolean;
		onselect?: (color: string) => void;
		onmousedown?: HTMLButtonAttributes['onmousedown'];
	}

	let {
		color,
		selected = false,
		label = `Color ${color}`,
		disabled = false,
		onselect,
		onmousedown
	}: Props = $props();
</script>

<button
	type="button"
	{disabled}
	aria-label={label}
	aria-pressed={selected}
	onmousedown={(event) => {
		event.preventDefault();
		onmousedown?.(event);
	}}
	onclick={() => onselect?.(color)}
	class="h-4 w-4 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-focus-primary focus:ring-offset-1 control-disabled {selected
		? 'scale-110 border-border-emphasis'
		: 'border-transparent'}"
	style:background-color={color}
></button>
