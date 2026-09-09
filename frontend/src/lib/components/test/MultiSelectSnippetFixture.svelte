<script lang="ts">
	import MultiSelect from '../MultiSelect.svelte';

	interface Person {
		id: string;
		name: string;
	}

	let selected = $state<Person[]>([]);
	let latest = $state('');
	const people: Person[] = [
		{ id: 'casey', name: 'Casey Stone' },
		{ id: 'riley', name: 'Riley Chen' },
		{ id: 'morgan', name: 'Morgan Reed' }
	];

	function handleChange(values: Person[]) {
		latest = values.map((person) => person.id).join(',');
	}
</script>

<MultiSelect
	options={people}
	bind:selected
	label="Assignees"
	placeholder="Choose assignees"
	getOptionLabel={(person) => person.name}
	optionKey={(person) => person.id}
	onChange={handleChange}
>
	{#snippet selectedContent(person)}
		<span data-testid={`selected-${person.id}`}>{person.name}</span>
	{/snippet}

	{#snippet optionContent(person)}
		<span data-testid={`option-${person.id}`}>{person.name}</span>
	{/snippet}
</MultiSelect>

<p>Selected count: {selected.length}</p>
<p>Latest ids: {latest || '(none)'}</p>
