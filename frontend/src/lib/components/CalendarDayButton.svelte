<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props {
		value: string;
		day: number;
		label: string;
		selected?: boolean;
		current?: boolean;
		adjacent?: boolean;
		disabled?: boolean;
		focused?: boolean;
		element?: HTMLButtonElement;
		onclick?: HTMLButtonAttributes['onclick'];
		onkeydown?: HTMLButtonAttributes['onkeydown'];
	}

	let {
		value,
		day,
		label,
		selected = false,
		current = false,
		adjacent = false,
		disabled = false,
		focused = false,
		element = $bindable(),
		onclick,
		onkeydown
	}: Props = $props();

	const handleClick: HTMLButtonAttributes['onclick'] = (event) => {
		if (!disabled) onclick?.(event);
	};

	const handleKeydown: HTMLButtonAttributes['onkeydown'] = (event) => {
		if (!disabled) onkeydown?.(event);
	};

	const stateClasses = $derived(
		selected
			? 'bg-primary text-on-action'
			: current
				? 'bg-primary-surface font-semibold text-primary-strong'
				: adjacent
					? 'text-subdued hover:bg-surface-subtle'
					: 'text-label hover:bg-surface-subtle'
	);
</script>

<button
	bind:this={element}
	type="button"
	role="gridcell"
	data-date={value}
	{disabled}
	aria-label={label}
	aria-selected={selected}
	aria-current={current ? 'date' : undefined}
	tabindex={focused ? 0 : -1}
	onclick={handleClick}
	onkeydown={handleKeydown}
	class="aspect-square rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus-primary disabled:cursor-not-allowed disabled:opacity-30 {stateClasses}"
>
	{day}
</button>
