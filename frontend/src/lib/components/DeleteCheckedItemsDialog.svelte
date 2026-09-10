<script lang="ts">
	import Button from './Button.svelte';

	interface Props {
		count: number;
		deleting?: boolean;
		error?: string;
		onconfirm: () => void | Promise<void>;
		oncancel: () => void;
	}

	let { count, deleting = false, error = '', onconfirm, oncancel }: Props = $props();
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center bg-overlay/40 px-4">
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-checked-title"
		class="w-full max-w-sm rounded-lg bg-surface p-5 shadow-xl"
	>
		<h2 id="delete-checked-title" class="text-base font-semibold text-heading">
			Delete all checked items?
		</h2>
		<p class="mt-2 text-sm text-supporting">
			This will <strong class="font-semibold text-danger">permanently delete {count} checked {count === 1 ? 'item' : 'items'}</strong> from this list.
		</p>
		<p class="mt-2 text-sm text-supporting">
			Checked items hidden by filters will also be deleted.
		</p>
		{#if error}
			<p class="mt-3 text-sm text-danger">{error}</p>
		{/if}
		<div class="mt-5 flex justify-end gap-2">
			<Button tone="neutral" appearance="outline" onclick={oncancel} disabled={deleting}>
				Cancel
			</Button>
			<Button
				tone="danger"
				appearance="solid"
				onclick={onconfirm}
				loading={deleting}
				loadingLabel="Deleting..."
			>
				Delete checked
			</Button>
		</div>
	</div>
</div>
