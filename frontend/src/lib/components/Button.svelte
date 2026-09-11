<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { controlTypographyPresets } from './controlStyles';
	import { iconTouchTargetPresets } from './iconRegistry';

	type Tone = 'primary' | 'neutral' | 'danger' | 'success';
	type Appearance = 'solid' | 'outline' | 'soft' | 'ghost' | 'bare';
	type Size =
		| 'default'
		| 'large'
		| 'small'
		| 'compact'
		| 'icon'
		| 'icon-compact'
		| 'icon-standard'
		| 'icon-header'
		| 'menu'
		| 'menu-indented'
		| 'chip'
		| 'backdrop'
		| 'field'
		| 'display'
		| 'display-plain'
		| 'empty'
		| 'header'
		| 'row'
		| 'row-muted'
		| 'title';
	type Align = 'center' | 'start' | 'between';
	type Weight = 'normal' | 'medium' | 'bold';
	type Emphasis = 'default' | 'muted' | 'subtle';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'class' | 'disabled' | 'type'> {
		tone?: Tone;
		appearance?: Appearance;
		size?: Size;
		align?: Align;
		weight?: Weight;
		emphasis?: Emphasis;
		selected?: boolean;
		active?: boolean;
		invalid?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		class?: string;
		element?: HTMLButtonElement | null;
		children?: Snippet;
	}

	let {
		tone = 'primary',
		appearance = 'solid',
		size = 'default',
		align = 'center',
		weight = 'medium',
		emphasis = 'default',
		selected = false,
		active = false,
		invalid = false,
		type = 'button',
		disabled = false,
		loading = false,
		loadingLabel = 'Loading…',
		class: className = '',
		element = $bindable(null),
		children,
		onclick,
		...restProps
	}: Props = $props();

	const toneAppearanceClasses: Record<Tone, Record<Appearance, string>> = {
		primary: {
			solid: 'bg-primary text-on-action hover:bg-primary-strong focus-visible:ring-focus-primary',
			outline:
				'border border-primary-border bg-surface text-primary-strong hover:bg-primary-surface focus-visible:ring-focus-primary',
			soft: 'bg-primary-surface text-primary-strong hover:bg-primary-subtle focus-visible:ring-focus-primary',
			ghost: 'bg-transparent text-primary hover:bg-primary-surface focus-visible:ring-focus-primary',
			bare: 'bg-transparent text-primary hover:text-primary-emphasis focus-visible:ring-focus-primary'
		},
		neutral: {
			solid: 'bg-neutral text-on-action hover:bg-neutral-hover focus-visible:ring-focus-neutral',
			outline:
				'border border-border-strong bg-surface text-label hover:bg-canvas focus-visible:ring-focus-primary',
			soft: 'bg-canvas text-label hover:bg-surface-subtle focus-visible:ring-focus-primary',
			ghost: 'bg-transparent text-label hover:bg-surface-subtle focus-visible:ring-focus-primary',
			bare: 'bg-transparent text-label hover:text-heading focus-visible:ring-focus-primary'
		},
		danger: {
			solid: 'bg-danger text-on-action hover:bg-danger-strong focus-visible:ring-focus-danger',
			outline:
				'border border-danger-border bg-surface text-danger-strong hover:bg-danger-surface focus-visible:ring-focus-danger',
			soft: 'bg-danger-surface text-danger-strong hover:bg-danger-subtle focus-visible:ring-focus-danger',
			ghost: 'bg-transparent text-danger hover:bg-danger-surface focus-visible:ring-focus-danger',
			bare: 'bg-transparent text-danger hover:text-danger-strong focus-visible:ring-focus-danger'
		},
		success: {
			solid: 'bg-success text-on-action hover:bg-success-strong focus-visible:ring-focus-success',
			outline:
				'border border-success-border bg-surface text-success-strong hover:bg-success-surface focus-visible:ring-focus-success',
			soft: 'bg-success-surface text-success-strong hover:bg-success-subtle focus-visible:ring-focus-success',
			ghost: 'bg-transparent text-success hover:bg-success-surface focus-visible:ring-focus-success',
			bare: 'bg-transparent text-success hover:text-success-strong focus-visible:ring-focus-success'
		}
	};

	const sizeClasses: Record<Size, string> = {
		default: `rounded-lg px-4 py-2 ${controlTypographyPresets.default}`,
		large: `rounded-lg px-4 py-2.5 ${controlTypographyPresets.default}`,
		small: `rounded-md px-3 py-1.5 ${controlTypographyPresets.default}`,
		compact: `rounded px-2 py-1 ${controlTypographyPresets.compact}`,
		icon: 'rounded p-1',
		'icon-compact': iconTouchTargetPresets.controlCompact.className,
		'icon-standard': iconTouchTargetPresets.control.className,
		'icon-header': iconTouchTargetPresets.header.className,
		menu: `w-full rounded-none px-4 py-2 text-left ${controlTypographyPresets.default}`,
		'menu-indented': `w-full rounded-none px-6 py-1.5 text-left ${controlTypographyPresets.default}`,
		chip: `rounded-full px-2 py-0.5 ${controlTypographyPresets.compact}`,
		backdrop: 'rounded-none p-0',
		field: `rounded px-3 py-2 ${controlTypographyPresets.default}`,
		display: `min-h-10 rounded px-3 py-2 text-left ${controlTypographyPresets.default}`,
		'display-plain': `rounded p-0 text-left ${controlTypographyPresets.default}`,
		empty: `rounded-xl border-2 border-dashed px-4 py-3 ${controlTypographyPresets.default}`,
		header: `w-full rounded px-1 py-0.5 ${controlTypographyPresets.compact} uppercase tracking-wider`,
		row: 'w-full rounded-lg px-4 py-3 text-left',
		'row-muted': 'w-full rounded-xl px-4 py-3 text-left',
		title: `rounded p-0 text-left ${controlTypographyPresets.title}`
	};

	const alignClasses: Record<Align, string> = {
		center: 'justify-center',
		start: 'justify-start',
		between: 'justify-between'
	};

	const weightClasses: Record<Weight, string> = {
		normal: 'font-normal',
		medium: 'font-medium',
		bold: 'font-bold'
	};

	const emphasisClasses: Record<Emphasis, string> = {
		default: '',
		muted: 'text-muted hover:text-label',
		subtle: 'text-faint hover:text-supporting'
	};

	const presentationClasses = $derived.by(() => {
		if (invalid) {
			return 'border border-danger-indicator bg-danger-surface text-label hover:bg-danger-surface focus-visible:ring-focus-danger';
		}
		if (size === 'chip' && selected) {
			return 'border border-primary-border bg-primary-subtle text-primary-strong hover:bg-primary-soft focus-visible:ring-focus-primary';
		}
		if (active) {
			return 'bg-primary-subtle text-heading focus-visible:ring-focus-primary';
		}
		if (selected && (appearance === 'bare' || appearance === 'ghost')) {
			return 'bg-transparent text-menu-selected hover:bg-surface-subtle focus-visible:ring-focus-primary';
		}
		if (tone === 'neutral' && (appearance === 'bare' || appearance === 'ghost') && emphasis !== 'default') {
			return `bg-transparent focus-visible:ring-focus-primary ${emphasisClasses[emphasis]}`;
		}
		return toneAppearanceClasses[tone][appearance];
	});

	const handleClick: HTMLButtonAttributes['onclick'] = (event) => {
		if (!disabled && !loading) {
			onclick?.(event);
		}
	};
</script>

<button
	bind:this={element}
	{type}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
	onclick={handleClick}
	class="inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 control-focus control-disabled {alignClasses[
		align
	]} {weightClasses[weight]} {presentationClasses} {sizeClasses[size]} {className}"
	{...restProps}
>
	{#if loading}
		{loadingLabel}
	{:else}
		{#if children}{@render children()}{/if}
	{/if}
</button>
