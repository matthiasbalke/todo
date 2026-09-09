<script lang="ts">
	import Icon from './Icon.svelte';

	type Size = 'card' | 'form';

	interface Props {
		starred: boolean;
		disabled?: boolean;
		size?: Size;
		onactivate?: (event: Event) => void;
	}

	let { starred, disabled = false, size = 'card', onactivate }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		card: 'h-8 w-8',
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
	aria-label={starred ? 'Unstar' : 'Star'}
	aria-pressed={starred}
	onclick={activate}
	ontouchendcapture={(event) => {
		event.stopPropagation();
		event.preventDefault();
		activate(event);
	}}
	class="{sizeClasses[size]} inline-flex flex-shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 {starred
		? 'text-yellow-400'
		: 'text-gray-200 hover:text-yellow-300'}"
>
	<Icon name="star" size="action" fill={starred ? 'currentColor' : 'none'} />
</button>
