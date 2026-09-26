<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'> {
		expanded?: boolean;
		children?: Snippet;
	}

	let { expanded = false, children, ...restProps }: Props = $props();
	let footerElement = $state<HTMLElement | null>(null);

	onMount(() => {
		if (!footerElement || typeof document === 'undefined') return;
		const rootStyle = document.documentElement.style;
		const updateFooterHeight = () => {
			rootStyle.setProperty('--fixed-action-footer-height', `${footerElement?.getBoundingClientRect().height ?? 0}px`);
		};
		updateFooterHeight();
		const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateFooterHeight) : null;
		observer?.observe(footerElement);
		window.addEventListener('resize', updateFooterHeight);
		return () => {
			observer?.disconnect();
			window.removeEventListener('resize', updateFooterHeight);
			rootStyle.removeProperty('--fixed-action-footer-height');
		};
	});
</script>

<footer
	bind:this={footerElement}
	{...restProps}
	data-testid="fixed-action-footer"
	class="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface shadow-lg"
>
	<div
		data-testid="fixed-action-footer-content"
		class="mx-auto max-w-2xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3"
	>
		{#if expanded}
			<div
				data-testid="fixed-action-footer-scroll"
				class="max-h-[min(70vh,calc(100vh-2rem))] overflow-y-auto"
			>
				{#if children}{@render children()}{/if}
			</div>
		{:else}
			{#if children}{@render children()}{/if}
		{/if}
	</div>
</footer>
