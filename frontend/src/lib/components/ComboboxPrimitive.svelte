<script module lang="ts">
	let nextComboboxId = 0;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount, tick } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Button from './Button.svelte';

	type Size = 'default' | 'compact' | 'dense';

	interface Props<T> {
		options: T[];
		inputValue?: string;
		selectedOption?: T | null;
		disabled?: boolean;
		required?: boolean;
		label?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		type?: HTMLInputAttributes['type'];
		errorMessage?: string | null;
		emptyMessage?: string;
		noMatchMessage?: string;
		optionKey?: (option: T, index: number) => string;
		getOptionLabel?: (option: T) => string;
		selectedContent?: Snippet;
		optionContent?: Snippet<[T]>;
		inputElement?: HTMLInputElement | null;
		oninputvalue?: (value: string, event: Event) => void;
		onoptionselect?: (option: T) => void;
		onclose?: () => void;
		onfocus?: HTMLInputAttributes['onfocus'];
		onblur?: HTMLInputAttributes['onblur'];
	}

	let {
		options = [],
		inputValue = '',
		selectedOption = null,
		disabled = false,
		required = false,
		label = '',
		placeholder = 'Select an option',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		type = 'text',
		errorMessage = null,
		emptyMessage = 'No options available',
		noMatchMessage = 'No matching options',
		optionKey = (_option: any, index: number) => String(index),
		getOptionLabel = (option: any) => String(option),
		selectedContent,
		optionContent,
		inputElement = $bindable(null),
		oninputvalue,
		onoptionselect,
		onclose,
		onfocus,
		onblur
	}: Props<any> = $props();

	let isOpen = $state(false);
	let focusedIndex = $state(-1);
	let dropdownElement: HTMLElement | undefined = $state();
	let containerElement: HTMLElement | undefined = $state();
	const generatedId = `combobox-${nextComboboxId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const resolvedListboxId = $derived(listboxId || `${generatedId}-listbox`);
	const accessibleName = $derived(label || placeholder);
	const isError = $derived(Boolean(errorMessage));
	const inputSizeClasses = $derived(
		size === 'default'
			? 'min-h-10 px-3 py-2 text-sm'
			: size === 'compact'
				? 'px-3 py-1.5 text-sm'
				: 'px-2 py-1 text-xs'
	);
	const inputCharacterWidth = $derived.by(() => {
		const visibleLength = Math.max(1, inputValue.length || placeholder.length);
		const maxWidth = size === 'dense' ? 6 : size === 'compact' ? 14 : 24;
		return Math.min(visibleLength, maxWidth);
	});
	const activeOptionId = $derived(
		isOpen && focusedIndex >= 0 && focusedIndex < options.length
			? `${resolvedListboxId}-option-${focusedIndex}`
			: undefined
	);
	const selectedIndex = $derived(
		selectedOption !== null ? options.findIndex((option) => option === selectedOption) : -1
	);

	function openDropdown() {
		if (disabled) return;
		isOpen = true;
		focusedIndex = selectedIndex >= 0 ? selectedIndex : options.length > 0 ? 0 : -1;
	}

	function closeDropdown() {
		isOpen = false;
		focusedIndex = -1;
		onclose?.();
	}

	function selectOption(option: any) {
		onoptionselect?.(option);
		closeDropdown();
	}

	function handleTriggerClick() {
		if (!isOpen) openDropdown();
	}

	async function handleInput(event: Event) {
		if (disabled) return;
		oninputvalue?.((event.currentTarget as HTMLInputElement).value, event);
		if (!isOpen) {
			isOpen = true;
		}
		await tick();
		focusedIndex = options.length > 0 ? 0 : -1;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen) {
			if (event.key === 'Enter' || event.key === 'ArrowDown') {
				event.preventDefault();
				openDropdown();
			}
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, options.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Home':
				event.preventDefault();
				focusedIndex = options.length > 0 ? 0 : -1;
				break;
			case 'End':
				event.preventDefault();
				focusedIndex = options.length - 1;
				break;
			case 'Enter':
				event.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < options.length) {
					selectOption(options[focusedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				inputElement?.focus();
				break;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (containerElement && !containerElement.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	function handleFocusOut() {
		setTimeout(() => {
			if (containerElement && !containerElement.contains(document.activeElement)) {
				closeDropdown();
			}
		}, 0);
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	$effect(() => {
		if (!isOpen) return;
		if (options.length === 0) {
			focusedIndex = -1;
		} else if (focusedIndex < 0 || focusedIndex >= options.length) {
			focusedIndex = 0;
		}
	});

	$effect(() => {
		if (dropdownElement && focusedIndex >= 0) {
			const optionElements = dropdownElement.querySelectorAll('[role="option"]');
			const element = optionElements[focusedIndex] as HTMLElement;
			if (element && typeof element.scrollIntoView === 'function') {
				element.scrollIntoView({ block: 'nearest' });
			}
		}
	});
</script>

<div bind:this={containerElement} class="flex flex-col gap-1 {className}">
	{#if label}
		<label for={triggerId} class="text-sm font-medium text-gray-700">
			{label}
			{#if required}<span class="text-red-500" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	<div class="relative" onfocusout={handleFocusOut}>
		<div
			class="flex w-full items-center gap-2 rounded border bg-white text-gray-700 transition-colors focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed {isError
				? 'border-red-500 bg-red-50 focus-within:ring-red-500'
				: 'border-gray-300 hover:bg-gray-50 focus-within:ring-blue-500'} {disabled ? 'cursor-not-allowed opacity-50' : ''} {inputSizeClasses}"
		>
			{#if selectedContent}
				{@render selectedContent()}
			{/if}
			<input
				bind:this={inputElement}
				id={triggerId}
				{type}
				role="combobox"
				value={inputValue}
				size={inputCharacterWidth}
				{placeholder}
				{disabled}
				{required}
				aria-autocomplete="list"
				aria-label={label ? undefined : placeholder}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={isOpen ? resolvedListboxId : undefined}
				aria-activedescendant={activeOptionId}
				aria-describedby={isError ? `${triggerId}-error` : undefined}
				aria-invalid={isError || undefined}
				onfocus={onfocus}
				onclick={handleTriggerClick}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				onblur={onblur}
				class="min-w-0 flex-1 bg-transparent p-0 text-left font-normal outline-none placeholder:text-gray-500 placeholder:italic disabled:cursor-not-allowed"
			/>
			<svg
				class="h-4 w-4 flex-shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</div>

		{#if isOpen}
			<div
				bind:this={dropdownElement}
				id={resolvedListboxId}
				role="listbox"
				aria-label={accessibleName}
				class="absolute left-0 top-full z-50 max-h-60 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow-lg"
			>
				{#each options as option, index (optionKey(option, index))}
					<Button
						id={`${resolvedListboxId}-option-${index}`}
						role="option"
						aria-selected={selectedOption === option}
						onpointerdown={(event) => event.preventDefault()}
						onclick={() => selectOption(option)}
						onmouseenter={() => (focusedIndex = index)}
						tone="neutral"
						appearance="bare"
						size="menu"
						align="start"
						weight={selectedOption === option ? 'medium' : 'normal'}
						selected={selectedOption === option}
						active={focusedIndex === index}
					>
						{#if optionContent}
							{@render optionContent(option)}
						{:else}
							{getOptionLabel(option)}
						{/if}
					</Button>
				{/each}

				{#if options.length === 0}
					<div class="px-3 py-2 text-center text-gray-500">
						{inputValue.trim() ? noMatchMessage : emptyMessage}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if errorMessage}
		<p id={`${triggerId}-error`} class="text-sm text-red-600">
			{errorMessage}
		</p>
	{/if}
</div>
