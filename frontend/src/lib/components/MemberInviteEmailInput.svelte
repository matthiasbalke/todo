<script module lang="ts">
	let nextInviteEmailInputId = 0;
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { MemberSuggestionDto } from '$lib/api/lists';
	import EmailInput from './EmailInput.svelte';

	interface Props extends Omit<ComponentProps<typeof EmailInput>, 'type'> {
		suggestions?: MemberSuggestionDto[];
	}

	let {
		value = $bindable(''),
		suggestions = [],
		id,
		...restProps
	}: Props = $props();

	const generatedId = `member-invite-email-${nextInviteEmailInputId++}`;
	const inputId = $derived(id || generatedId);
	const listId = $derived(`${inputId}-suggestions`);
</script>

<EmailInput
	bind:value
	id={inputId}
	list={listId}
	{...restProps}
/>

<datalist id={listId}>
	{#each suggestions as suggestion (suggestion.userId)}
		<option value={suggestion.email} label={`${suggestion.displayName} (${suggestion.email})`}></option>
	{/each}
</datalist>
