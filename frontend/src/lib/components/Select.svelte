<script module lang="ts">
	let nextSelectId = 0;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import Button from './Button.svelte';

	type Size = 'default' | 'compact' | 'dense';

	interface Props<T> {
		options: T[];
		selected?: T | null;
		disabled?: boolean;
		label?: string;
		placeholder?: string;
		labelId?: string;
		id?: string;
		listboxId?: string;
		class?: string;
		size?: Size;
		getOptionLabel?: (option: T) => string;
		validate?: ((value: T | null) => string | null) | null;
		onSelect?: (value: T) => void;
	}

	let {
		options = [],
		selected = $bindable(null),
		disabled = false,
		label = '',
		placeholder = 'Select an option',
		labelId = '',
		id = '',
		listboxId = '',
		class: className = '',
		size = 'default',
		getOptionLabel = (option: any) => String(option),
		validate = null,
		onSelect
	}: Props<any> = $props();

	let isOpen = $state(false);
	let focusedIndex = $state(-1);
	let errorMessage = $state<string | null>(null);
	let triggerElement: HTMLInputElement | null = $state(null);
	let dropdownElement: HTMLElement | undefined = $state();
	let containerElement: HTMLElement | undefined = $state();
	let internalSelected = $state(selected ?? null);
	let query = $state<string | null>(null);
	const generatedId = `select-${nextSelectId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const resolvedListboxId = $derived(listboxId || `${generatedId}-listbox`);
	const accessibleName = $derived(label || placeholder);
	const inputSizeClasses = $derived(
		size === 'default' ? 'min-h-10 px-3 py-2 text-sm' : size === 'compact' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'
	);

	const selectedIndex = $derived(internalSelected !== null ? options.indexOf(internalSelected) : -1);
	const selectedLabel = $derived(internalSelected !== null ? getOptionLabel(internalSelected) : '');
	const searchText = $derived(query ?? '');
	const normalizedSearch = $derived(searchText.trim().toLocaleLowerCase());
	const filteredOptions = $derived.by(() => {
		if (!normalizedSearch) return options;
		return options.filter((option) =>
			getOptionLabel(option).toLocaleLowerCase().includes(normalizedSearch)
		);
	});
	const filteredSelectedIndex = $derived(
		internalSelected !== null ? filteredOptions.indexOf(internalSelected) : -1
	);
	const inputValue = $derived(query ?? selectedLabel);
	const inputCharacterWidth = $derived.by(() => {
		const visibleLength = Math.max(1, inputValue.length || placeholder.length);
		const maxWidth = size === 'dense' ? 6 : size === 'compact' ? 14 : 24;
		return Math.min(visibleLength, maxWidth);
	});
	const activeOptionId = $derived(
		isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length
			? `${resolvedListboxId}-option-${focusedIndex}`
			: undefined
	);

	function openDropdown() {
		if (!disabled) {
			isOpen = true;
			focusedIndex = filteredSelectedIndex >= 0 ? filteredSelectedIndex : filteredOptions.length > 0 ? 0 : -1;
		}
	}

	function closeDropdown({ resetQuery = true } = {}) {
		isOpen = false;
		focusedIndex = -1;
		if (resetQuery) {
			query = null;
		}
	}

	function selectOption(option: any) {
		internalSelected = option;
		selected = option;
		closeDropdown();

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

	function handleTriggerClick() {
		if (disabled) return;
		if (!isOpen) openDropdown();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === 'ArrowDown') {
				e.preventDefault();
				openDropdown();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, filteredOptions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Home':
				e.preventDefault();
				focusedIndex = filteredOptions.length > 0 ? 0 : -1;
				break;
			case 'End':
				e.preventDefault();
				focusedIndex = filteredOptions.length - 1;
				break;
			case 'Enter':
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
					selectOption(filteredOptions[focusedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				closeDropdown();
				break;
	}
}

	function handleClickOutside(e: MouseEvent) {
		if (containerElement && !containerElement.contains(e.target as Node)) {
			closeDropdown();
		}
	}

	function handleInput(e: Event) {
		if (disabled) return;
		query = (e.currentTarget as HTMLInputElement).value;
		if (!isOpen) {
			isOpen = true;
		}
		focusedIndex = filteredOptions.length > 0 ? 0 : -1;
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

	function handleFocusOut() {
		setTimeout(() => {
			if (containerElement && !containerElement.contains(document.activeElement)) {
				closeDropdown();
			}
		}, 0);
	}

	$effect(() => {
		internalSelected = selected ?? null;
		if (!isOpen) {
			query = null;
		}
	});

	$effect(() => {
		if (!isOpen) return;
		if (filteredOptions.length === 0) {
			focusedIndex = -1;
		} else if (focusedIndex < 0 || focusedIndex >= filteredOptions.length) {
			focusedIndex = 0;
		}
	});

	onMount(() => {
		if (validate && internalSelected !== null) {
			try {
				errorMessage = validate(internalSelected);
			} catch (err) {
				console.error('Select validator error:', err);
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
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

	const isError = $derived(errorMessage !== null && errorMessage !== '');
</script>

<div bind:this={containerElement} class="flex flex-col gap-1 {className}">
	{#if label}
		<label for={triggerId} class="text-sm font-medium text-gray-700">
			{label}
		</label>
	{/if}

	<div class="relative" onfocusout={handleFocusOut}>
		<div
			class="flex w-full items-center gap-2 rounded border bg-white text-gray-700 transition-colors focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed {isError
				? 'border-red-500 bg-red-50 focus-within:ring-red-500'
				: 'border-gray-300 hover:bg-gray-50 focus-within:ring-blue-500'} {disabled ? 'cursor-not-allowed opacity-50' : ''} {inputSizeClasses}"
		>
			<input
				bind:this={triggerElement}
				id={triggerId}
				type="text"
				role="combobox"
				value={inputValue}
				size={inputCharacterWidth}
				{placeholder}
				{disabled}
				aria-autocomplete="list"
				aria-label={label ? undefined : placeholder}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={isOpen ? resolvedListboxId : undefined}
				aria-activedescendant={activeOptionId}
				aria-describedby={isError ? `${triggerId}-error` : undefined}
				aria-invalid={isError || undefined}
				onfocus={handleFocus}
				onclick={handleTriggerClick}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				onblur={handleBlur}
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
				{#each filteredOptions as option, index (index)}
					<Button
						id={`${resolvedListboxId}-option-${index}`}
						role="option"
						aria-selected={filteredSelectedIndex === index}
						onclick={() => selectOption(option)}
						onmouseenter={() => (focusedIndex = index)}
						tone="neutral"
						appearance="bare"
						size="menu"
						align="start"
						weight={filteredSelectedIndex === index ? 'medium' : 'normal'}
						selected={filteredSelectedIndex === index}
						active={focusedIndex === index}
					>
						{getOptionLabel(option)}
					</Button>
				{/each}

				{#if filteredOptions.length === 0}
					<div class="px-3 py-2 text-gray-500 text-center">
						{options.length === 0 ? 'No options available' : 'No matching options'}
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
