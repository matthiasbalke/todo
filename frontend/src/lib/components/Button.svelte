<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'danger';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'class' | 'disabled' | 'type'> {
		variant?: Variant;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		class?: string;
		children: Snippet;
	}

	const {
		variant = 'primary',
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
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
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
	class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {variantClasses[
		variant
	]} {className}"
	{...restProps}
>
	{#if loading}
		{loadingLabel}
	{:else}
		{@render children()}
	{/if}
</button>
