<script module lang="ts">
	let nextEditableLabelId = 0;
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import TextInput from './TextInput.svelte';

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
		displayAppearance?: 'default' | 'plain';
		inputSize?: 'default' | 'small' | 'compact';
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
		displayAppearance = 'default',
		inputSize = 'default',
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

	$effect(() => {
		if (isEditing) {
			element?.focus();
		}
	});
</script>

{#if isEditing}
	<div class="flex flex-col gap-1">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="flex items-center gap-2 {containerClass}"
			role={saveMode === 'explicit' ? 'group' : undefined}
			onmousedown={saveMode === 'explicit' ? handleExplicitMouseDown : undefined}
			onfocusout={saveMode === 'explicit' ? handleExplicitFocusOut : undefined}
		>
			<TextInput
				bind:element
				bind:value={editValue}
				id={inputId}
				{type}
				{label}
				{placeholder}
				disabled={isSaving}
				{required}
				ariaLabel={ariaLabel || label}
				{validate}
				size={inputSize}
				oninput={handleInput}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				class="min-w-0 flex-1"
			/>

			{#if saveMode === 'explicit'}
				<Button
					onclick={saveEdit}
					loading={isSaving}
					loadingLabel="Saving…"
				>
					Save
				</Button>
				{#if showCancel}
					<Button
						tone="neutral"
						appearance="ghost"
						onclick={cancelEdit}
						disabled={isSaving}
					>
						Cancel
					</Button>
				{/if}
			{/if}
		</div>
	</div>
{:else}
	<Button
		onclick={startEdit}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				startEdit();
			}
		}}
		role="button"
		aria-label={ariaLabel || `Edit ${label}`.trim()}
		aria-disabled={disabled || isSaving}
		disabled={disabled || isSaving}
		tone="neutral"
		appearance={displayAppearance === 'plain' ? 'bare' : 'ghost'}
		size={displayAppearance === 'plain' ? 'display-plain' : 'display'}
		align="start"
		weight="normal"
	>
		{value || placeholder || 'Click to edit'}
	</Button>
{/if}
