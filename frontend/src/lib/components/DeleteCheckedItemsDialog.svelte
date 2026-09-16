<script lang="ts">
	import ConfirmDialog from './ConfirmDialog.svelte';

	interface Props {
		count: number;
		deleting?: boolean;
		error?: string;
		onconfirm: () => void | Promise<void>;
		oncancel: () => void;
	}

	let { count, deleting = false, error = '', onconfirm, oncancel }: Props = $props();
</script>

<ConfirmDialog
	title="Delete all checked items?"
	confirmLabel="Delete checked"
	loadingLabel="Deleting..."
	pending={deleting}
	{error}
	onconfirm={onconfirm}
	oncancel={oncancel}
>
	<p>
		This will <strong class="font-semibold text-danger">permanently delete {count} checked {count === 1 ? 'item' : 'items'}</strong> from this list.
	</p>
	<p>
		Checked items hidden by filters will also be deleted.
	</p>
</ConfirmDialog>
