<script module lang="ts">
	let nextTextInputId = 0;
</script>

<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { controlTypographyPresets, controlGeometryPresets } from './controlStyles';

	type Size = 'default' | 'small' | 'compact' | 'title';
	type Appearance = 'default' | 'inline';

	interface Props
		extends Omit<
			HTMLInputAttributes,
			| 'aria-describedby'
			| 'aria-invalid'
			| 'aria-label'
			| 'class'
			| 'disabled'
			| 'id'
			| 'onblur'
			| 'onfocus'
			| 'oninput'
			| 'required'
			| 'size'
			| 'type'
			| 'value'
		> {
		value?: string;
		label?: string;
		description?: string;
		type?: HTMLInputAttributes['type'];
		disabled?: boolean;
		required?: boolean;
		validate?: ((value: string) => string | null) | null;
		ariaLabel?: string;
		id?: string;
		size?: Size;
		appearance?: Appearance;
		class?: string;
		containerClass?: string;
		element?: HTMLInputElement | null;
		'aria-describedby'?: string;
		'aria-label'?: string;
		oninput?: HTMLInputAttributes['oninput'];
		onblur?: HTMLInputAttributes['onblur'];
		onfocus?: HTMLInputAttributes['onfocus'];
	}

	let {
		value = $bindable(''),
		label = '',
		description = '',
		type = 'text',
		disabled = false,
		required = false,
		validate = null,
		ariaLabel,
		id,
		size = 'default',
		appearance = 'default',
		class: className = '',
		containerClass = '',
		element = $bindable(null),
		'aria-describedby': consumerDescribedBy,
		'aria-label': nativeAriaLabel,
		oninput,
		onblur,
		onfocus,
		...restProps
	}: Props = $props();

	let errorMessage = $state<string | null>(null);
	const generatedId = `text-input-${nextTextInputId++}`;
	const inputId = $derived(id || generatedId);
	const descriptionId = $derived(`${inputId}-description`);
	const errorId = $derived(`${inputId}-error`);
	const isError = $derived(Boolean(errorMessage));
	const describedBy = $derived(
		[consumerDescribedBy, description ? descriptionId : null, isError ? errorId : null]
			.filter(Boolean)
			.join(' ') || undefined
	);
	const sizeClasses: Record<Size, string> = {
		default: `${controlGeometryPresets.default} ${controlTypographyPresets.default}`,
		small: `${controlGeometryPresets.small} ${controlTypographyPresets.default}`,
		compact: `px-2 py-0.5 ${controlTypographyPresets.default}`,
		title: `px-0 py-0 ${controlTypographyPresets.title} font-bold`
	};
	const appearanceClasses: Record<Appearance, string> = {
		default: 'rounded border',
		inline: 'rounded border border-transparent bg-transparent'
	};
	const stateClasses = $derived(
		appearance === 'inline'
			? isError
				? 'border-danger-indicator focus:ring-focus-danger'
				: 'hover:bg-canvas focus:ring-focus-primary'
			: isError
				? 'border-danger-indicator bg-danger-surface focus:ring-focus-danger'
				: 'border-border-strong bg-surface hover:bg-canvas focus:ring-focus-primary'
	);

	function runValidation() {
		if (!validate) {
			errorMessage = null;
			return;
		}
		try {
			errorMessage = validate(value);
		} catch (error) {
			console.error('TextInput validator error:', error);
		}
	}

	const handleInput: NonNullable<HTMLInputAttributes['oninput']> = (event) => {
		value = event.currentTarget.value;
		runValidation();
		oninput?.(event);
	};

	const handleBlur: NonNullable<HTMLInputAttributes['onblur']> = (event) => {
		runValidation();
		onblur?.(event);
	};
</script>

<div class="flex flex-col gap-1 {containerClass}">
	{#if label}
		<label for={inputId} class="typography-label">
			{label}
			{#if required}<span class="text-danger-indicator" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{#if description}
		<p id={descriptionId} class="typography-supporting">{description}</p>
	{/if}

	<input
		bind:this={element}
		id={inputId}
		{type}
		{value}
		{disabled}
		{required}
		aria-label={ariaLabel ?? nativeAriaLabel ?? (label || undefined)}
		aria-invalid={isError}
		aria-describedby={describedBy}
		oninput={handleInput}
		onblur={handleBlur}
		{onfocus}
		class="native-placeholder text-value transition-colors focus:outline-none focus:ring-2 {sizeClasses[size]} {appearanceClasses[
			appearance
		]} {stateClasses} disabled:bg-surface disabled:hover:bg-canvas disabled:cursor-not-allowed control-disabled {className}"
		{...restProps}
	/>

	{#if errorMessage}
		<p id={errorId} class="typography-error">{errorMessage}</p>
	{/if}
</div>
