<script module lang="ts">
	let nextInviteEmailInputId = 0;
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { MemberSuggestionDto } from '$lib/api/lists';
	import EmailInput from './EmailInput.svelte';
	import ComboboxPrimitive from './ComboboxPrimitive.svelte';

	interface Props extends Omit<ComponentProps<typeof EmailInput>, 'type' | 'size'> {
		suggestions?: MemberSuggestionDto[];
	}

	let {
		value = $bindable(''),
		suggestions = [],
		id,
		label = 'Email',
		placeholder = 'your@email.com',
		required = true,
		disabled = false,
		class: className = '',
		customValidate = null,
		element = $bindable(null),
		oninput,
		onblur,
		onfocus,
	}: Props = $props();

	const generatedId = `member-invite-email-${nextInviteEmailInputId++}`;
	const inputId = $derived(id || generatedId);
	const resolvedLabel = $derived(label ?? '');
	const resolvedPlaceholder = $derived(placeholder ?? '');
	let errorMessage = $state<string | null>(null);
	const normalizedQuery = $derived(value.trim().toLocaleLowerCase());
	const filteredSuggestions = $derived.by(() => {
		if (!normalizedQuery) return suggestions;
		return suggestions.filter((suggestion) =>
			`${suggestion.displayName} ${suggestion.email}`.toLocaleLowerCase().includes(normalizedQuery)
		);
	});

	function validateEmail(email: string): string | null {
		if (required && !email) return 'Email is required';
		if (!email) return null;
		if (!email.includes('@')) return 'Email must include @';
		const [local, domain] = email.split('@');
		if (!local || !domain) return 'Email must include a valid local and domain part';
		if (!domain.includes('.')) return 'Email must include a domain';
		return customValidate?.(email) ?? null;
	}

	function runValidation() {
		try {
			errorMessage = validateEmail(value);
		} catch (error) {
			console.error('MemberInviteEmailInput validator error:', error);
		}
	}

	function handleInput(nextValue: string, event: Event) {
		value = nextValue;
		runValidation();
		oninput?.(event as Parameters<NonNullable<typeof oninput>>[0]);
	}

	function handleBlur(event: FocusEvent) {
		runValidation();
		onblur?.(event as Parameters<NonNullable<typeof onblur>>[0]);
	}

	function handleSuggestionSelect(suggestion: MemberSuggestionDto) {
		value = suggestion.email;
		runValidation();
	}

	function getSuggestionLabel(suggestion: MemberSuggestionDto) {
		return `${suggestion.displayName} (${suggestion.email})`;
	}
</script>

<ComboboxPrimitive
	options={filteredSuggestions}
	inputValue={value}
	type="email"
	id={inputId}
	label={resolvedLabel}
	placeholder={resolvedPlaceholder}
	{required}
	{disabled}
	class={className}
	errorMessage={errorMessage}
	getOptionLabel={getSuggestionLabel}
	optionKey={(suggestion) => suggestion.userId}
	bind:inputElement={element}
	oninputvalue={handleInput}
	onoptionselect={handleSuggestionSelect}
	onblur={handleBlur}
	{onfocus}
>
	{#snippet optionContent(suggestion)}
		<span class="flex min-w-0 flex-col text-left">
			<span class="truncate font-medium">{suggestion.displayName}</span>
			<span class="truncate text-xs text-muted">{suggestion.email}</span>
		</span>
	{/snippet}
</ComboboxPrimitive>
