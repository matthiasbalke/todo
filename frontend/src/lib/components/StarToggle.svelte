<script lang="ts">
	interface Props {
		starred: boolean;
		disabled?: boolean;
		onactivate?: (event: Event) => void;
	}

	let { starred, disabled = false, onactivate }: Props = $props();

	function activate(event: Event) {
		if (disabled) return;
		onactivate?.(event);
	}
</script>

<button
	type="button"
	{disabled}
	aria-label={starred ? 'Unstar' : 'Star'}
	aria-pressed={starred}
	onclick={activate}
	ontouchendcapture={(event) => {
		event.stopPropagation();
		event.preventDefault();
		activate(event);
	}}
	class="flex-shrink-0 text-lg leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 {starred
		? 'text-yellow-400'
		: 'text-gray-200 hover:text-yellow-300'}"
>★</button>
