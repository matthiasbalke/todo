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

	const {
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
	let triggerElement: HTMLButtonElement | null = $state(null);
	let dropdownElement: HTMLElement | undefined = $state();
	let containerElement: HTMLElement | undefined = $state();
	let dropdownPosition = $state({ top: 0, left: 0, width: 0 });
	let internalSelected = $state(selected ?? null);
	const generatedId = `select-${nextSelectId++}`;
	const triggerId = $derived(id || labelId || `${generatedId}-trigger`);
	const resolvedListboxId = $derived(listboxId || `${generatedId}-listbox`);
	const triggerSize = $derived(size === 'default' ? 'field' : size === 'compact' ? 'small' : 'compact');

	const selectedIndex = $derived(internalSelected !== null ? options.indexOf(internalSelected) : -1);

	function openDropdown() {
		if (!disabled) {
			isOpen = true;
			focusedIndex = selectedIndex >= 0 ? selectedIndex : 0;
			updateDropdownPosition();
		}
	}

	function closeDropdown() {
		isOpen = false;
		focusedIndex = -1;
	}

	function updateDropdownPosition() {
		if (triggerElement) {
			const rect = triggerElement.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom,
				left: rect.left,
				width: rect.width
			};
		}
	}

	function selectOption(option: any) {
		internalSelected = option;
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
		isOpen ? closeDropdown() : openDropdown();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault();
				openDropdown();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, options.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Home':
				e.preventDefault();
				focusedIndex = 0;
				break;
			case 'End':
				e.preventDefault();
				focusedIndex = options.length - 1;
				break;
			case 'Enter':
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < options.length) {
					selectOption(options[focusedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				closeDropdown();
				triggerElement?.focus();
				break;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerElement && !containerElement.contains(e.target as Node)) {
			closeDropdown();
		}
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

	<Button
		bind:element={triggerElement}
		id={triggerId}
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-controls={isOpen ? resolvedListboxId : undefined}
		aria-describedby={isError ? `${triggerId}-error` : undefined}
		onclick={handleTriggerClick}
		onkeydown={handleKeyDown}
		onblur={handleBlur}
		tone="neutral"
		appearance="outline"
		size={triggerSize}
		align="between"
		weight="normal"
		invalid={isError}
		class="w-full"
	>
		<span class="text-left {internalSelected === null ? 'text-gray-500' : ''}">
			{#if internalSelected !== null}
				{getOptionLabel(internalSelected)}
			{:else}
				<span class="italic">{placeholder}</span>
			{/if}
		</span>
		<svg
			class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
		</svg>
	</Button>

	{#if errorMessage}
		<p id={`${triggerId}-error`} class="text-sm text-red-600">
			{errorMessage}
		</p>
	{/if}
</div>

{#if isOpen}
	<div
		bind:this={dropdownElement}
		id={resolvedListboxId}
		role="listbox"
		aria-label={label}
		class="fixed z-50 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
		style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;"
	>
		{#each options as option, index (index)}
			<Button
				role="option"
				aria-selected={selectedIndex === index}
				onclick={() => selectOption(option)}
				onmouseenter={() => (focusedIndex = index)}
				tone="neutral"
				appearance="bare"
				size="menu"
				align="start"
				weight={selectedIndex === index ? 'medium' : 'normal'}
				selected={selectedIndex === index}
				active={focusedIndex === index}
			>
				{getOptionLabel(option)}
			</Button>
		{/each}

		{#if options.length === 0}
			<div class="px-3 py-2 text-gray-500 text-center">
				No options available
			</div>
		{/if}
	</div>
{/if}
