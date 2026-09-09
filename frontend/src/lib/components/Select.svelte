<script module lang="ts">
	let nextSelectId = 0;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import ComboboxPrimitive from './ComboboxPrimitive.svelte';

	type Size = 'default' | 'compact' | 'dense';
	type Appearance = 'default' | 'inline';

	interface Props<T> {
		options: T[];
		selected?: T | null;
		disabled?: boolean;
		label?: string;
		ariaLabel?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		appearance?: Appearance;
		getOptionLabel?: (option: T) => string;
		getSelectedLabel?: (option: T) => string;
		selectedContent?: Snippet<[T]>;
		optionContent?: Snippet<[T]>;
		validate?: ((value: T | null) => string | null) | null;
		onSelect?: (value: T) => void;
	}

	let {
		options = [],
		selected = $bindable(null),
		disabled = false,
		label = '',
		ariaLabel = '',
		placeholder = 'Select an option',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		appearance = 'default',
		getOptionLabel = (option: any) => String(option),
		getSelectedLabel = getOptionLabel,
		selectedContent: selectedContentSnippet,
		optionContent: optionContentSnippet,
		validate = null,
		onSelect
	}: Props<any> = $props();

	let errorMessage = $state<string | null>(null);
	let triggerElement: HTMLInputElement | null = $state(null);
	let internalSelected = $state(selected ?? null);
	let query = $state<string | null>(null);
	const generatedId = `select-${nextSelectId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const selectedLabel = $derived(internalSelected !== null ? getSelectedLabel(internalSelected) : '');
	const searchText = $derived(query ?? '');
	const normalizedSearch = $derived(searchText.trim().toLocaleLowerCase());
	const filteredOptions = $derived.by(() => {
		if (!normalizedSearch) return options;
		return options.filter((option) =>
			getOptionLabel(option).toLocaleLowerCase().includes(normalizedSearch)
		);
	});
	const inputValue = $derived(query ?? selectedLabel);

	function selectOption(option: any) {
		internalSelected = option;
		selected = option;

		if (validate) {
			try {
				errorMessage = validate(internalSelected);
			} catch (err) {
				console.error('Select validator error:', err);
			}
		}

		if (onSelect) {
			onSelect(option);
		}
	}

	function handleClose() {
		query = null;
	}

	function handleInput(value: string) {
		if (disabled) return;
		query = value;
	}

	function handleFocus() {
		if (disabled) return;
		triggerElement?.select();
	}

	function handleBlur() {
		if (validate && internalSelected !== null) {
			try {
				errorMessage = validate(internalSelected);
			} catch (err) {
				console.error('Select validator error:', err);
			}
		}
	}

	$effect(() => {
		internalSelected = selected ?? null;
	});

	$effect(() => {
		if (validate && internalSelected !== null) {
			try {
				errorMessage = validate(internalSelected);
			} catch (err) {
				console.error('Select validator error:', err);
			}
		}
	});
</script>

<ComboboxPrimitive
	options={filteredOptions}
	selectedOption={internalSelected}
	{inputValue}
	{disabled}
	{label}
	{ariaLabel}
	{placeholder}
	{labelId}
	id={triggerId}
	listboxId={listboxId || `${generatedId}-listbox`}
	class={className}
	{size}
	{appearance}
	{getOptionLabel}
	{errorMessage}
	emptyMessage={options.length === 0 ? 'No options available' : 'No matching options'}
	noMatchMessage="No matching options"
	bind:inputElement={triggerElement}
	oninputvalue={handleInput}
	onoptionselect={selectOption}
	onclose={handleClose}
	onfocus={handleFocus}
	onblur={handleBlur}
>
	{#snippet selectedContent()}
		{#if selectedContentSnippet && internalSelected !== null && query === null}
			{@render selectedContentSnippet(internalSelected)}
		{/if}
	{/snippet}

	{#snippet optionContent(option)}
		{#if optionContentSnippet}
			{@render optionContentSnippet(option)}
		{:else}
			{getOptionLabel(option)}
		{/if}
	{/snippet}
</ComboboxPrimitive>
