<script lang="ts">
	interface Props {
		done: boolean;
		disabled?: boolean;
		onactivate?: (event: Event) => void;
	}

	let { done, disabled = false, onactivate }: Props = $props();

	function activate(event: Event) {
		if (disabled) return;
		onactivate?.(event);
	}
</script>

<button
	type="button"
	{disabled}
	aria-label={done ? 'Mark undone' : 'Mark done'}
	aria-pressed={done}
	onclick={activate}
	ontouchendcapture={(event) => {
		event.stopPropagation();
		event.preventDefault();
		activate(event);
	}}
	class="h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 {done
		? 'border-green-500 bg-green-500'
		: 'border-gray-300 hover:border-green-400'}"
>
	{#if done}
		<svg class="mx-auto h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
		</svg>
	{/if}
</button>
