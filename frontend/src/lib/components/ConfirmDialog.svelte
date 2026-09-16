<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';

	interface Props {
		title: string;
		confirmLabel: string;
		cancelLabel?: string;
		loadingLabel?: string;
		error?: string;
		pending?: boolean;
		returnFocusTo?: HTMLElement | null;
		onconfirm: () => void | Promise<void>;
		oncancel: () => void;
		children?: Snippet;
	}

	let {
		title,
		confirmLabel,
		cancelLabel = 'Cancel',
		loadingLabel = 'Deleting...',
		error = '',
		pending = false,
		returnFocusTo = null,
		onconfirm,
		oncancel,
		children
	}: Props = $props();

	function handleCancel() {
		if (pending) return;
		oncancel();
	}

	function handleConfirm() {
		if (pending) return;
		void onconfirm();
	}
</script>

<Dialog {title} onclose={handleCancel} {returnFocusTo} class="max-w-sm">
	<div class="space-y-2 text-sm text-supporting">
		{#if children}{@render children()}{/if}
	</div>
	{#if error}
		<p class="mt-3 text-sm text-danger">{error}</p>
	{/if}

	{#snippet footer()}
		<Button tone="neutral" appearance="outline" onclick={handleCancel} disabled={pending}>
			{cancelLabel}
		</Button>
		<Button
			tone="danger"
			appearance="solid"
			onclick={handleConfirm}
			loading={pending}
			{loadingLabel}
		>
			{confirmLabel}
		</Button>
	{/snippet}
</Dialog>
