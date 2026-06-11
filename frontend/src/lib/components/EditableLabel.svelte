<script module lang="ts">
	let nextEditableLabelId = 0;
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		value?: string;
		label?: string;
		placeholder?: string;
		type?: string;
		disabled?: boolean;
		required?: boolean;
		validate?: ((value: string) => string | null) | null;
		isSaving?: boolean;
		ariaLabel?: string;
		saveMode?: 'automatic' | 'explicit';
		id?: string;
		displayClass?: string;
		inputClass?: string;
		containerClass?: string;
		showCancel?: boolean;
		oncancel?: () => void;
		onchange?: (value: string) => void;
		element?: HTMLInputElement | null;
	}

	let {
		value = $bindable(''),
		label = '',
		placeholder = '',
		type = 'text',
		disabled = false,
		required = false,
		validate = null,
		isSaving = false,
		ariaLabel,
		saveMode = 'automatic',
		id = '',
		displayClass = '',
		inputClass = '',
		containerClass = '',
		showCancel = false,
		oncancel,
		onchange,
		element = $bindable(null)
	}: Props = $props();

	const dispatch = createEventDispatcher<{ change: { value: string } }>();

	let isEditing = $state(false);
	let editValue = $state('');
	let errorMessage = $state<string | null>(null);
	let ignoreNextFocusOut = false;
	const generatedId = `editable-label-${nextEditableLabelId++}`;
	const inputId = $derived(id || `${generatedId}-input`);
	const errorId = $derived(`${inputId}-error`);

	function startEdit() {
		if (disabled || isSaving) return;
		isEditing = true;
		editValue = value;
		errorMessage = null;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		editValue = target.value;
		if (validate) {
			try {
				errorMessage = validate(editValue);
			} catch (err) {
				console.error('EditableLabel validator error:', err);
			}
		}
	}

	function saveEdit() {
		if (validate) {
			try {
				errorMessage = validate(editValue);
				if (errorMessage !== null && errorMessage !== '') {
					return;
				}
			} catch (err) {
				console.error('EditableLabel validator error:', err);
				return;
			}
		}

		if (editValue !== value) {
			value = editValue;
			onchange?.(editValue);
			dispatch('change', { value: editValue });
		}
		isEditing = false;
		errorMessage = null;
	}

	function cancelEdit() {
		isEditing = false;
		editValue = value;
		errorMessage = null;
		oncancel?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (saveMode === 'automatic') {
				saveEdit();
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEdit();
		}
	}

	function handleBlur() {
		if (isEditing && saveMode === 'automatic') {
			saveEdit();
		}
	}

	function handleExplicitMouseDown() {
		ignoreNextFocusOut = true;
		setTimeout(() => {
			ignoreNextFocusOut = false;
		}, 0);
	}

	function handleExplicitFocusOut(e: FocusEvent) {
		if (ignoreNextFocusOut) {
			ignoreNextFocusOut = false;
			return;
		}

		const editor = e.currentTarget as HTMLElement;
		if (!editor.contains(e.relatedTarget as Node | null)) {
			cancelEdit();
		}
	}

	const isError = $derived(errorMessage !== null && errorMessage !== '');

	$effect(() => {
		if (isEditing) {
			element?.focus();
		}
	});
</script>

{#if isEditing}
	<div class="flex flex-col gap-1">
		{#if label}
		<label for={inputId} class="text-sm font-medium text-gray-700">
				{label}
				{#if required}
					<span class="text-red-500">*</span>
				{/if}
			</label>
		{/if}

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="flex items-center gap-2 {containerClass}"
			role={saveMode === 'explicit' ? 'group' : undefined}
			onmousedown={saveMode === 'explicit' ? handleExplicitMouseDown : undefined}
			onfocusout={saveMode === 'explicit' ? handleExplicitFocusOut : undefined}
		>
			<input
				bind:this={element}
				id={inputId}
				{type}
				bind:value={editValue}
				{placeholder}
				disabled={isSaving}
				{required}
				aria-label={ariaLabel || label}
				aria-invalid={isError}
				aria-describedby={isError ? errorId : undefined}
				oninput={handleInput}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				class="min-w-0 flex-1 px-3 py-2 rounded border transition-colors {isError
					? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
					: 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'} {isSaving
					? 'opacity-50 cursor-not-allowed'
					: ''} disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300 {inputClass}"
			/>

			{#if saveMode === 'explicit'}
				<button
					type="button"
					onclick={saveEdit}
					disabled={isSaving}
					class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSaving ? 'Saving…' : 'Save'}
				</button>
				{#if showCancel}
					<button
						type="button"
						onclick={cancelEdit}
						disabled={isSaving}
						class="px-3 py-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
					>
						Cancel
					</button>
				{/if}
			{/if}
		</div>

		{#if errorMessage}
			<p id={errorId} class="text-sm text-red-600">
				{errorMessage}
			</p>
		{/if}
	</div>
{:else}
	<div
		onclick={startEdit}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				startEdit();
			}
		}}
		role="button"
		tabindex={disabled || isSaving ? -1 : 0}
		aria-label={ariaLabel || `Edit ${label}`.trim()}
		aria-disabled={disabled || isSaving}
		class="px-3 py-2 rounded border-2 border-transparent bg-white transition-all hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 {disabled ||
		isSaving
			? 'cursor-not-allowed opacity-50 text-gray-400'
			: 'cursor-pointer text-gray-700 hover:bg-gray-50'} {displayClass}"
	>
		{value || placeholder || 'Click to edit'}
	</div>
{/if}

<style>
	input {
		font-family: inherit;
	}

	div[role='button'] {
		min-height: 2.5rem; /* Same as py-2 + font height */
		display: flex;
		align-items: center;
	}
</style>
