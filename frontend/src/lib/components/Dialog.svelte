<script module lang="ts">
	let nextDialogId = 0;
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		title: string;
		closeLabel?: string;
		onclose: () => void;
		returnFocusTo?: HTMLElement | null;
		class?: string;
		bodyClass?: string;
		showFooter?: boolean;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		title,
		closeLabel = 'Close',
		onclose,
		returnFocusTo = null,
		class: className = '',
		bodyClass = 'space-y-4 p-4',
		showFooter,
		children,
		footer
	}: Props = $props();

	let dialogElement = $state<HTMLDivElement | null>(null);
	const titleId = `dialog-title-${nextDialogId++}`;
	const shouldShowFooter = $derived(showFooter ?? Boolean(footer));

	function getFocusableElements(): HTMLElement[] {
		if (!dialogElement) return [];
		return Array.from(
			dialogElement.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);
	}

	async function closeDialog() {
		onclose();
		await tick();
		returnFocusTo?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			void closeDialog();
			return;
		}
		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) {
			event.preventDefault();
			dialogElement?.focus();
			return;
		}

		const first = focusable[0];
		const last = focusable.at(-1)!;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function handleOverlayPointerdown(event: PointerEvent) {
		if (event.target !== event.currentTarget) return;
		event.preventDefault();
		void closeDialog();
	}

	onMount(() => {
		dialogElement?.focus();
	});
</script>

<div
	role="presentation"
	class="fixed inset-0 z-50 bg-overlay/40 p-4"
	onpointerdown={handleOverlayPointerdown}
>
	<div
		bind:this={dialogElement}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		class="mx-auto mt-16 max-w-md rounded-lg border border-border bg-surface shadow-lg {className}"
		onkeydown={handleKeydown}
	>
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<h2 id={titleId} class="text-base font-semibold text-heading">{title}</h2>
			<Button type="button" tone="neutral" appearance="bare" size="icon-compact" aria-label={closeLabel} onclick={closeDialog}>
				<Icon name="close" size="compact" />
			</Button>
		</div>

		<div class={bodyClass}>
			{#if children}{@render children()}{/if}
		</div>

		{#if footer && shouldShowFooter}
			<div class="flex justify-end gap-2 border-t border-border px-4 py-3">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
