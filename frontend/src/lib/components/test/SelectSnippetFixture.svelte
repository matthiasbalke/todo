<script lang="ts">
	import Select from '../Select.svelte';

	let selected = 'category-1';
	const options = ['category-1', 'category-2'];

	function getOptionLabel(option: string) {
		return option === 'category-1' ? 'Groceries' : 'Household';
	}
</script>

<Select {options} bind:selected label="Snippet select" {getOptionLabel}>
	{#snippet selectedContent(option)}
		<span data-testid="selected-prefix">{option}</span>
	{/snippet}

	{#snippet optionContent(option)}
		<span data-testid={`option-content-${option}`}>{getOptionLabel(option)}</span>
	{/snippet}
</Select>
