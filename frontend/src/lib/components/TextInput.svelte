<script lang="ts">
	export let value: string = '';
	export let label: string = '';
	export let placeholder: string = '';
	export let type: string = 'text';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let validate: ((value: string) => string | null) | null = null;
	export let ariaLabel: string | undefined = undefined;

	let errorMessage: string | null = null;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		if (validate) {
			try {
				errorMessage = validate(value);
			} catch (err) {
				console.error('TextInput validator error:', err);
			}
		}
	}

	function handleBlur() {
		if (validate) {
			try {
				errorMessage = validate(value);
			} catch (err) {
				console.error('TextInput validator error:', err);
			}
		}
	}

	function handleFocus() {
		// Focus event can be used by parent for custom logic
	}

	$: isError = errorMessage !== null && errorMessage !== '';

</script>

<div class="flex flex-col gap-1">
	{#if label}
		<label for="text-input" class="text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<input
		id="text-input"
		{type}
		{value}
		{placeholder}
		{disabled}
		{required}
		aria-label={ariaLabel || label}
		aria-invalid={isError}
		aria-describedby={isError ? 'error-message' : undefined}
		on:input={handleInput}
		on:blur={handleBlur}
		on:focus={handleFocus}
		class="px-3 py-2 rounded border transition-colors {isError
			? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
			: 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'} disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300"
	/>

	{#if errorMessage}
		<p id="error-message" class="text-sm text-red-600">
			{errorMessage}
		</p>
	{/if}
</div>

<style>
	input {
		font-family: inherit;
	}
</style>
