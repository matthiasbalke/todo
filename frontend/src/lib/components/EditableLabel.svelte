<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let value: string = '';
	export let label: string = '';
	export let placeholder: string = '';
	export let type: string = 'text';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let validate: ((value: string) => string | null) | null = null;
	export let isSaving: boolean = false;
	export let ariaLabel: string | undefined = undefined;
	export let saveMode: 'automatic' | 'explicit' = 'automatic';

	const dispatch = createEventDispatcher<{ change: { value: string } }>();

	let isEditing = false;
	let editValue = value;
	let errorMessage: string | null = null;
	let inputElement: HTMLInputElement;
	let ignoreNextFocusOut = false;

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
			dispatch('change', { value: editValue });
		}
		isEditing = false;
		errorMessage = null;
	}

	function cancelEdit() {
		isEditing = false;
		editValue = value;
		errorMessage = null;
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

	$: isError = errorMessage !== null && errorMessage !== '';

	onMount(() => {
		if (isEditing && inputElement) {
			inputElement.focus();
		}
	});
</script>

{#if isEditing}
	<div class="flex flex-col gap-1">
		{#if label}
			<label for="editable-label-input" class="text-sm font-medium text-gray-700">
				{label}
				{#if required}
					<span class="text-red-500">*</span>
				{/if}
			</label>
		{/if}

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="flex items-center gap-2"
			role={saveMode === 'explicit' ? 'group' : undefined}
			on:mousedown={saveMode === 'explicit' ? handleExplicitMouseDown : undefined}
			on:focusout={saveMode === 'explicit' ? handleExplicitFocusOut : undefined}
		>
			<input
				bind:this={inputElement}
				id="editable-label-input"
				{type}
				bind:value={editValue}
				{placeholder}
				disabled={isSaving}
				{required}
				aria-label={ariaLabel || label}
				aria-invalid={isError}
				aria-describedby={isError ? 'editable-label-error' : undefined}
				on:input={handleInput}
				on:blur={handleBlur}
				on:keydown={handleKeydown}
				class="min-w-0 flex-1 px-3 py-2 rounded border transition-colors {isError
					? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
					: 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'} {isSaving
					? 'opacity-50 cursor-not-allowed'
					: ''} disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300"
			/>

			{#if saveMode === 'explicit'}
				<button
					type="button"
					on:click={saveEdit}
					disabled={isSaving}
					class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSaving ? 'Saving…' : 'Save'}
				</button>
			{/if}
		</div>

		{#if errorMessage}
			<p id="editable-label-error" class="text-sm text-red-600">
				{errorMessage}
			</p>
		{/if}
	</div>
{:else}
	<div
		on:click={startEdit}
		on:keydown={(e) => {
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
			: 'cursor-pointer text-gray-700 hover:bg-gray-50'}"
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
