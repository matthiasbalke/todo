<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'bare';
	type Size = 'default' | 'small' | 'compact' | 'icon' | 'menu' | 'chip' | 'backdrop';
	type Align = 'center' | 'start' | 'between';
	type Weight = 'normal' | 'medium';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'class' | 'disabled' | 'type'> {
		variant?: Variant;
		size?: Size;
		align?: Align;
		weight?: Weight;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		class?: string;
		children?: Snippet;
	}

	const {
		variant = 'primary',
		size = 'default',
		align = 'center',
		weight = 'medium',
		type = 'button',
		disabled = false,
		loading = false,
		loadingLabel = 'Loading…',
		class: className = '',
		children,
		onclick,
		...restProps
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
		secondary:
			'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
		ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-500',
		bare: 'bg-transparent focus-visible:ring-blue-500'
	};

	const sizeClasses: Record<Size, string> = {
		default: 'rounded-lg px-4 py-2 text-sm',
		small: 'rounded-md px-3 py-1.5 text-sm',
		compact: 'rounded px-2 py-1 text-xs',
		icon: 'rounded p-1',
		menu: 'rounded-none px-3 py-1.5 text-sm',
		chip: 'rounded-full px-2 py-0.5 text-xs',
		backdrop: 'rounded-none p-0'
	};

	const alignClasses: Record<Align, string> = {
		center: 'justify-center',
		start: 'justify-start',
		between: 'justify-between'
	};

	const weightClasses: Record<Weight, string> = {
		normal: 'font-normal',
		medium: 'font-medium'
	};

	const handleClick: HTMLButtonAttributes['onclick'] = (event) => {
		if (!disabled && !loading) {
			onclick?.(event);
		}
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
	onclick={handleClick}
	class="inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {alignClasses[
		align
	]} {weightClasses[weight]} {variantClasses[
		variant
	]} {sizeClasses[size]} {className}"
	{...restProps}
>
	{#if loading}
		{loadingLabel}
	{:else}
		{#if children}{@render children()}{/if}
	{/if}
</button>
