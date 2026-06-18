<script lang="ts">
	import CalendarDayButton from '../CalendarDayButton.svelte';

	interface Props {
		onbound: (element: HTMLButtonElement) => void;
	}

	let { onbound }: Props = $props();
	let element = $state<HTMLButtonElement>();

	$effect(() => {
		if (element) onbound(element);
	});
</script>

<CalendarDayButton
	bind:element
	value="2026-06-10"
	day={10}
	label="Wednesday, June 10, 2026"
/>
