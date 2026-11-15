<script module lang="ts">
	let nextSelectId = 0;
</script>

<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import ComboboxPrimitive from './ComboboxPrimitive.svelte';

	type Size = 'default' | 'compact' | 'dense' | 'display';
	type Appearance = 'default' | 'inline';

	interface Props<T> {
		options: T[];
		selected?: T | null;
		disabled?: boolean;
		consumeOutsidePointer?: boolean;
		inlineOptions?: boolean;
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
		isSelectedMuted?: (option: T) => boolean;
		selectedContent?: Snippet<[T]>;
		optionContent?: Snippet<[T]>;
		validate?: ((value: T | null) => string | null) | null;
		onSelect?: (value: T) => void;
		onCreate?: (name: string) => Promise<T>;
		canCreate?: (name: string) => boolean;
		createErrorMessage?: string;
	}

	let {
		options = [],
		selected = $bindable(null),
		disabled = false,
		consumeOutsidePointer = true,
		inlineOptions = false,
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
		isSelectedMuted = () => false,
		selectedContent: selectedContentSnippet,
		optionContent: optionContentSnippet,
		validate = null,
		onSelect,
		onCreate,
		canCreate = (name: string) => !options.some(option => getOptionLabel(option).trim().toLocaleLowerCase() === name.toLocaleLowerCase()),
		createErrorMessage = 'Could not create option. Please try again.'
	}: Props<any> = $props();

	const createAction = Symbol('create');
	let creating = $state(false);
	let requestToken = 0;
	onDestroy(() => { requestToken++; });
	let errorMessage = $state<string | null>(null);
	let triggerElement: HTMLInputElement | null = $state(null);
	let internalSelected = $state(selected ?? null);
	let query = $state<string | null>(null);
	const generatedId = `select-${nextSelectId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const selectedLabel = $derived(internalSelected !== null ? getSelectedLabel(internalSelected) : '');
	const mutedValue = $derived(
		query === null && internalSelected !== null && isSelectedMuted(internalSelected)
	);
	const searchText = $derived(query ?? '');
	const normalizedSearch = $derived(searchText.trim().toLocaleLowerCase());
	const filteredOptions = $derived.by(() => {
		if (!normalizedSearch) return options;
		return options.filter((option) =>
			getOptionLabel(option).toLocaleLowerCase().includes(normalizedSearch)
		);
	});
	const createName = $derived(searchText.trim());
	const showCreate = $derived(Boolean(onCreate && !disabled && createName && canCreate(createName)));
	const displayedOptions = $derived(showCreate ? [...filteredOptions, createAction] : filteredOptions);
	const inputValue = $derived(query ?? selectedLabel);
	const optionLabel = (option: any) => option === createAction ? `+ Create ${createName}` : getOptionLabel(option);

	function handleOptionSelect(option: any): boolean | Promise<boolean> {
		if (creating || disabled) return false;
		if (option !== createAction) {
			errorMessage = null;
			selectOption(option);
			return true;
		}
		return createOption();
	}

	async function createOption(): Promise<boolean> {
		if (!onCreate || !showCreate) return false;
		const name = createName;
		const token = ++requestToken;
		creating = true;
		errorMessage = null;
		try {
			const created = await onCreate(name);
			if (token !== requestToken || disabled) return false;
			creating = false;
			selectOption(created);
			return true;
		} catch {
			if (token === requestToken) {
				query = name;
				errorMessage = createErrorMessage;
			}
			return false;
		} finally {
			creating = false;
		}
	}

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
		requestToken++;
		query = null;
	}

	function handleInput(value: string) {
		if (disabled || creating) return;
		errorMessage = null;
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
	options={displayedOptions}
	busy={creating}
	selectedOption={internalSelected}
	{inputValue}
	{inlineOptions}
	{consumeOutsidePointer}
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
	{mutedValue}
	getOptionLabel={optionLabel}
	{errorMessage}
	emptyMessage={options.length === 0 ? 'No options available' : 'No matching options'}
	noMatchMessage="No matching options"
	bind:inputElement={triggerElement}
	oninputvalue={handleInput}
	onoptionselect={handleOptionSelect}
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
		{#if option === createAction}
			{optionLabel(option)}
		{:else if optionContentSnippet}
			{@render optionContentSnippet(option)}
		{:else}
			{getOptionLabel(option)}
		{/if}
	{/snippet}
</ComboboxPrimitive>

{#if creating}
	<p role="status" class="text-sm text-muted">Creating {createName}…</p>
{/if}
