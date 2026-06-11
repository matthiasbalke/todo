<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import TextInput from './TextInput.svelte';

	interface Props extends Omit<ComponentProps<typeof TextInput>, 'type' | 'validate'> {
		customValidate?: ((value: string) => string | null) | null;
	}

	let {
		value = $bindable(''),
		label = 'Email',
		placeholder = 'your@email.com',
		required = true,
		customValidate = null,
		element = $bindable(null),
		...restProps
	}: Props = $props();

	function validateEmail(email: string): string | null {
		if (required && !email) return 'Email is required';
		if (!email) return null;
		if (!email.includes('@')) return 'Email must include @';
		const [local, domain] = email.split('@');
		if (!local || !domain) return 'Email must include a valid local and domain part';
		if (!domain.includes('.')) return 'Email must include a domain';
		return customValidate?.(email) ?? null;
	}
</script>

<TextInput
	bind:value
	bind:element
	{label}
	{placeholder}
	type="email"
	{required}
	validate={validateEmail}
	{...restProps}
/>
