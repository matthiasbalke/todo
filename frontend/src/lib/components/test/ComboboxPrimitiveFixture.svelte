<script lang="ts">
	import ComboboxPrimitive from '../ComboboxPrimitive.svelte';

	let value = $state('');
	let selected = $state<string | null>(null);
	const allOptions = ['Apple', 'Banana', 'Cherry'];
	const options = $derived.by(() => {
		const query = value.trim().toLocaleLowerCase();
		if (!query) return allOptions;
		return allOptions.filter((option) => option.toLocaleLowerCase().includes(query));
	});

	function handleInput(nextValue: string) {
		value = nextValue;
	}

	function handleSelect(option: string) {
		selected = option;
		value = option;
	}
</script>

<ComboboxPrimitive
	{options}
	inputValue={value}
	selectedOption={selected}
	label="Primitive fruit"
	oninputvalue={handleInput}
	onoptionselect={handleSelect}
/>

<p>Selected: {selected ?? '(none)'}</p>
