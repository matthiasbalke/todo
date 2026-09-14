<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'class' | 'type'> {
		removeLabel?: string;
		class?: string;
		element?: HTMLButtonElement | null;
		children?: Snippet;
		onremove?: HTMLButtonAttributes['onclick'];
	}

	let {
		removeLabel,
		class: className = '',
		element = $bindable(null),
		children,
		onclick,
		onremove,
		...restProps
	}: Props = $props();
</script>

<span
	class="inline-flex h-6 shrink-0 items-center overflow-hidden rounded-full border border-primary-soft bg-primary-surface text-xs text-primary-strong {className}"
>
	{#if onclick}
		<button
			bind:this={element}
			type="button"
			class="inline-flex h-full items-center gap-1.5 px-2 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-primary focus-visible:ring-offset-1 control-focus"
			onclick={onclick}
			{...restProps}
		>
			{#if children}{@render children()}{/if}
		</button>
	{:else}
		<span class="inline-flex h-full items-center gap-1.5">
			{#if children}{@render children()}{/if}
		</span>
	{/if}
	{#if onremove}
		<button
			type="button"
			class="flex h-full w-6 items-center justify-center border-l border-primary-soft text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-primary focus-visible:ring-offset-1 control-focus"
			aria-label={removeLabel}
			onclick={onremove}
		>
			<Icon name="close" size="metadata" />
		</button>
	{/if}
</span>
