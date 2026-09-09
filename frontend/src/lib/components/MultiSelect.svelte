<script module lang="ts">
	let nextMultiSelectId = 0;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import ComboboxPrimitive from './ComboboxPrimitive.svelte';
	import Icon from './Icon.svelte';

	type Size = 'default' | 'compact' | 'dense';

	interface Props<T> {
		options: T[];
		selected?: T[];
		disabled?: boolean;
		label?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		getOptionLabel?: (option: T) => string;
		optionKey?: (option: T, index: number) => string;
		selectedContent?: Snippet<[T]>;
		optionContent?: Snippet<[T]>;
		onChange?: (values: T[]) => void;
	}

	const defaultOptionKey = (_option: any, index: number) => String(index);

	let {
		options = [],
		selected = $bindable([]),
		disabled = false,
		label = '',
		placeholder = 'Select options',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		getOptionLabel = (option: any) => String(option),
		optionKey = defaultOptionKey,
		selectedContent: selectedContentSnippet,
		optionContent: optionContentSnippet,
		onChange
	}: Props<any> = $props();

	let query = $state<string | null>(null);
	let triggerElement: HTMLInputElement | null = $state(null);
	let internalSelected = $state<any[]>(selected ?? []);
	const generatedId = `multiselect-${nextMultiSelectId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const searchText = $derived(query ?? '');
	const normalizedSearch = $derived(searchText.trim().toLocaleLowerCase());
	const selectedOptions = $derived(internalSelected);
	const filteredOptions = $derived.by(() => {
		if (!normalizedSearch) return options;
		return options.filter((option) =>
			getOptionLabel(option).toLocaleLowerCase().includes(normalizedSearch)
		);
	});
	const inputPlaceholder = $derived(selectedOptions.length === 0 ? placeholder : '');

	function getOptionIdentity(option: any): string {
		const matchedIndex = options.findIndex((candidate, index) => {
			if (Object.is(candidate, option)) return true;
			if (optionKey === defaultOptionKey) return false;
			return optionKey(candidate, index) === optionKey(option, index);
		});

		return optionKey(option, matchedIndex >= 0 ? matchedIndex : -1);
	}

	function isSelected(option: any): boolean {
		const optionIdentity = getOptionIdentity(option);
		return internalSelected.some(
			(selectedOption) => getOptionIdentity(selectedOption) === optionIdentity
		);
	}

	function emit(nextSelected: any[]) {
		internalSelected = nextSelected;
		selected = nextSelected;
		onChange?.(nextSelected);
	}

	function toggleOption(option: any) {
		const optionIdentity = getOptionIdentity(option);
		const nextSelected = isSelected(option)
			? internalSelected.filter(
					(selectedOption) => getOptionIdentity(selectedOption) !== optionIdentity
				)
			: [...internalSelected, option];
		emit(nextSelected);
		query = '';
	}

	function handleInput(value: string) {
		if (disabled) return;
		query = value;
	}

	function handleClose() {
		query = null;
	}

	$effect(() => {
		internalSelected = selected ?? [];
	});
</script>

<ComboboxPrimitive
	options={filteredOptions}
	inputValue={searchText}
	selectedOption={null}
	{disabled}
	{label}
	placeholder={inputPlaceholder}
	{labelId}
	id={triggerId}
	listboxId={listboxId || `${generatedId}-listbox`}
	class={className}
	{size}
	{getOptionLabel}
	{optionKey}
	closeOnSelect={false}
	multiselectable
	isOptionSelected={isSelected}
	emptyMessage={options.length === 0 ? 'No options available' : 'No matching options'}
	noMatchMessage="No matching options"
	bind:inputElement={triggerElement}
	oninputvalue={handleInput}
	onoptionselect={toggleOption}
	onclose={handleClose}
>
	{#snippet selectedContent()}
		{#if selectedOptions.length > 0}
			<div class="flex min-w-0 flex-wrap gap-1">
				{#each selectedOptions as option, index (optionKey(option, index))}
					<span class="inline-flex max-w-full items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
						{#if selectedContentSnippet}
							{@render selectedContentSnippet(option)}
						{:else}
							{getOptionLabel(option)}
						{/if}
					</span>
				{/each}
			</div>
		{/if}
	{/snippet}

	{#snippet optionContent(option)}
		<span class="flex w-full items-center justify-between gap-3">
			<span class="min-w-0 flex-1 truncate">
				{#if optionContentSnippet}
					{@render optionContentSnippet(option)}
				{:else}
					{getOptionLabel(option)}
				{/if}
			</span>
			{#if isSelected(option)}
				<Icon name="check" size="compact" tone="menuSelected" class="flex-shrink-0" />
			{/if}
		</span>
	{/snippet}
</ComboboxPrimitive>
