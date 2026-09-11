<script lang="ts">
	import Icon from './Icon.svelte';

	type Size = 'card' | 'form';

	interface Props {
		done: boolean;
		disabled?: boolean;
		size?: Size;
		onactivate?: (event: Event) => void;
	}

	let { done, disabled = false, size = 'card', onactivate }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		card: 'h-6 w-6',
		form: 'h-10 w-10'
	};

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
	class="{sizeClasses[size]} flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-success focus-visible:ring-offset-1 control-focus control-disabled {done
		? 'text-success-indicator'
		: 'text-faint hover:text-success-highlight'}"
>
	<Icon name={done ? 'done' : 'status'} size="itemStatus" />
</button>
