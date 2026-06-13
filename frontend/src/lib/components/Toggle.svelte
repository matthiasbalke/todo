<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props
		extends Omit<
			HTMLButtonAttributes,
			'aria-label' | 'children' | 'class' | 'disabled' | 'onchange' | 'type'
		> {
		checked?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (checked: boolean) => void;
		id?: string;
		class?: string;
		element?: HTMLButtonElement | null;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		ariaLabel,
		onchange,
		id,
		class: className = '',
		element = $bindable(null),
		onclick,
		...restProps
	}: Props = $props();

	const handleClick: HTMLButtonAttributes['onclick'] = (event) => {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
		onclick?.(event);
	};
</script>

<button
	bind:this={element}
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={ariaLabel}
	{id}
	{disabled}
	{...restProps}
	onclick={handleClick}
	class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {checked
		? 'bg-blue-600'
		: 'bg-gray-300'} {className}"
>
	<span
		aria-hidden="true"
		class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out {checked
			? 'translate-x-5'
			: 'translate-x-0'}"
	></span>
</button>
