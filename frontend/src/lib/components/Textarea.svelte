<script module lang="ts">
	let nextTextareaId = 0;
</script>

<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { controlTypographyPresets, controlGeometryPresets } from './controlStyles';

	type Resize = 'none' | 'vertical' | 'horizontal' | 'both';
	type Size = 'default' | 'compact';
	type Appearance = 'default' | 'inline';

	interface Props
		extends Omit<
			HTMLTextareaAttributes,
			| 'aria-describedby'
			| 'aria-invalid'
			| 'aria-label'
			| 'class'
			| 'disabled'
			| 'onblur'
			| 'onfocus'
			| 'oninput'
			| 'onkeydown'
			| 'placeholder'
			| 'required'
			| 'rows'
			| 'value'
		> {
		value?: string;
		label?: string;
		description?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		rows?: number;
		resize?: Resize;
		size?: Size;
		appearance?: Appearance;
		validate?: ((value: string) => string | null) | null;
		ariaLabel?: string;
		class?: string;
		element?: HTMLTextAreaElement | null;
		'aria-describedby'?: string;
		'aria-label'?: string;
		oninput?: HTMLTextareaAttributes['oninput'];
		onblur?: HTMLTextareaAttributes['onblur'];
		onfocus?: HTMLTextareaAttributes['onfocus'];
		onkeydown?: HTMLTextareaAttributes['onkeydown'];
	}

	let {
		value = $bindable(''),
		label = '',
		description = '',
		placeholder = '',
		required = false,
		disabled = false,
		rows = 3,
		resize = 'vertical',
		size = 'default',
		appearance = 'default',
		validate = null,
		ariaLabel,
		class: className = '',
		element = $bindable(null),
		'aria-describedby': consumerDescribedBy,
		'aria-label': nativeAriaLabel,
		oninput,
		onblur,
		onfocus,
		onkeydown,
		...restProps
	}: Props = $props();

	let errorMessage = $state<string | null>(null);
	const instanceId = `textarea-${nextTextareaId++}`;
	const descriptionId = `${instanceId}-description`;
	const errorId = `${instanceId}-error`;

	const resizeClasses: Record<Resize, string> = {
		none: 'resize-none',
		vertical: 'resize-y',
		horizontal: 'resize-x',
		both: 'resize'
	};
	const sizeClasses: Record<Size, string> = {
		default: `${controlGeometryPresets.default} ${controlTypographyPresets.default}`,
		compact: `${controlGeometryPresets.compact} ${controlTypographyPresets.default}`
	};

	const isError = $derived(Boolean(errorMessage));
	const presentationClasses = $derived.by(() => {
		if (isError) {
			return 'border-danger-indicator bg-danger-surface focus:ring-focus-danger';
		}
		if (appearance === 'inline') {
			return 'border-transparent bg-transparent hover:bg-canvas focus:ring-focus-primary';
		}
		return 'border-border-strong bg-surface hover:bg-canvas focus:ring-focus-primary';
	});
	const describedBy = $derived(
		[consumerDescribedBy, description ? descriptionId : null, isError ? errorId : null]
			.filter(Boolean)
			.join(' ') || undefined
	);

	function runValidation() {
		if (!validate) {
			errorMessage = null;
			return;
		}

		try {
			errorMessage = validate(value);
		} catch (error) {
			console.error('Textarea validator error:', error);
		}
	}

	const handleInput: NonNullable<HTMLTextareaAttributes['oninput']> = (event) => {
		value = event.currentTarget.value;
		runValidation();
		oninput?.(event);
	};

	const handleBlur: NonNullable<HTMLTextareaAttributes['onblur']> = (event) => {
		runValidation();
		onblur?.(event);
	};
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<label for={instanceId} class="typography-label">
			{label}
			{#if required}<span class="text-danger-indicator" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{#if description}
		<p id={descriptionId} class="typography-supporting">{description}</p>
	{/if}

	<textarea
		bind:this={element}
		id={instanceId}
		{value}
		{placeholder}
		{required}
		{disabled}
		{rows}
		aria-label={ariaLabel ?? nativeAriaLabel}
		aria-invalid={isError}
		aria-describedby={describedBy}
		oninput={handleInput}
		onblur={handleBlur}
		onfocus={onfocus}
		onkeydown={onkeydown}
		class="native-placeholder text-value w-full rounded border transition-colors focus:outline-none focus:ring-2 {sizeClasses[size]} {presentationClasses} disabled:cursor-not-allowed disabled:bg-surface disabled:hover:bg-canvas control-disabled {resizeClasses[
			resize
		]} {className}"
		{...restProps}
	></textarea>

	{#if errorMessage}
		<p id={errorId} class="typography-error">{errorMessage}</p>
	{/if}
</div>
