<script lang="ts">
	import TextInput from './TextInput.svelte';

	export let value: string = '';
	export let label: string = 'Email';
	export let placeholder: string = 'your@email.com';
	export let disabled: boolean = false;
	export let required: boolean = true;
	export let ariaLabel: string | undefined = undefined;
	export let customValidate: ((value: string) => string | null) | null = null;

	function validateEmail(email: string): string | null {
		if (required && !email) {
			return 'Email is required';
		}
		if (!email) {
			return null;
		}
		if (!email.includes('@')) {
			return 'Email must include @';
		}
		const [local, domain] = email.split('@');
		if (!local || !domain) {
			return 'Email must include a valid local and domain part';
		}
		if (!domain.includes('.')) {
			return 'Email must include a domain';
		}
		if (customValidate) {
			return customValidate(email);
		}
		return null;
	}
</script>

<TextInput
	{value}
	on:input
	on:blur
	on:focus
	{label}
	{placeholder}
	type="email"
	{disabled}
	{required}
	{ariaLabel}
	validate={validateEmail}
/>
