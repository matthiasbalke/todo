<script lang="ts">
	import { onMount } from 'svelte';
	import Select from './Select.svelte';
	import {
		createTimeZoneOptions,
		detectBrowserTimeZone,
		formatTimeZoneLabel,
		getSupportedTimeZones
	} from './timezonePicker';

	type Size = 'default' | 'compact' | 'dense';

	interface Props {
		selected?: string | null;
		disabled?: boolean;
		label?: string;
		placeholder?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		onSelect?: (value: string) => void;
	}

	let {
		selected = $bindable(null),
		disabled = false,
		label = 'Timezone',
		placeholder = 'Select a timezone',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		onSelect
	}: Props = $props();

	let detectedTimeZone = $state<string | null>(null);
	let supportedTimeZones = $state<string[] | null>([]);
	const options = $derived(
		createTimeZoneOptions({ selected, detectedTimeZone, supportedTimeZones })
	);

	function handleSelect(value: string) {
		selected = value;
		onSelect?.(value);
	}

	onMount(() => {
		detectedTimeZone = detectBrowserTimeZone();
		supportedTimeZones = getSupportedTimeZones();
	});
</script>

<Select
	{options}
	bind:selected
	{disabled}
	{label}
	{placeholder}
	{id}
	{listboxId}
	class={className}
	{size}
	getOptionLabel={formatTimeZoneLabel}
	onSelect={handleSelect}
/>
