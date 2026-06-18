<script module lang="ts">
	let nextTextareaId = 0;
</script>

<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Resize = 'none' | 'vertical' | 'horizontal' | 'both';
	type Size = 'default' | 'compact';

	interface Props
		extends Omit<
			HTMLTextareaAttributes,
			| 'aria-describedby'
			| 'aria-invalid'
			| 'aria-label'
			| 'class'
			| 'disabled'
			| 'onblur'
			| 'oninput'
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
		validate?: ((value: string) => string | null) | null;
		ariaLabel?: string;
		class?: string;
		'aria-describedby'?: string;
		'aria-label'?: string;
		oninput?: HTMLTextareaAttributes['oninput'];
		onblur?: HTMLTextareaAttributes['onblur'];
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
		validate = null,
		ariaLabel,
		class: className = '',
		'aria-describedby': consumerDescribedBy,
		'aria-label': nativeAriaLabel,
		oninput,
		onblur,
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
		default: 'px-3 py-2 text-sm',
		compact: 'px-2 py-1 text-xs'
	};

	const isError = $derived(Boolean(errorMessage));
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
		<label for={instanceId} class="text-sm font-medium text-gray-700">
			{label}
			{#if required}<span class="text-red-500" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{#if description}
		<p id={descriptionId} class="text-sm text-gray-500">{description}</p>
	{/if}

	<textarea
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
		class="w-full rounded border transition-colors focus:outline-none focus:ring-2 {sizeClasses[size]} {isError
			? 'border-red-500 bg-red-50 focus:ring-red-500'
			: 'border-gray-300 bg-white focus:ring-blue-500'} disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 {resizeClasses[
			resize
		]} {className}"
		{...restProps}
	></textarea>

	{#if errorMessage}
		<p id={errorId} class="text-sm text-red-600">{errorMessage}</p>
	{/if}
</div>
