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
			solid: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
			outline:
				'border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-500',
			soft: 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-500',
			ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
			bare: 'bg-transparent text-blue-600 hover:text-blue-800 focus-visible:ring-blue-500'
		},
		neutral: {
			solid: 'bg-gray-700 text-white hover:bg-gray-800 focus-visible:ring-gray-500',
			outline:
				'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500',
			soft: 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-500',
			ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-blue-500',
			bare: 'bg-transparent text-gray-700 hover:text-gray-900 focus-visible:ring-blue-500'
		},
		danger: {
			solid: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
			outline:
				'border border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-500',
			soft: 'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500',
			ghost: 'bg-transparent text-red-600 hover:bg-red-50 focus-visible:ring-red-500',
			bare: 'bg-transparent text-red-600 hover:text-red-700 focus-visible:ring-red-500'
		},
		success: {
			solid: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
			outline:
				'border border-green-300 bg-white text-green-700 hover:bg-green-50 focus-visible:ring-green-500',
			soft: 'bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-500',
			ghost: 'bg-transparent text-green-600 hover:bg-green-50 focus-visible:ring-green-500',
			bare: 'bg-transparent text-green-600 hover:text-green-700 focus-visible:ring-green-500'
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
		muted: 'text-gray-500 hover:text-gray-700',
		subtle: 'text-gray-300 hover:text-gray-600'
	};

	const presentationClasses = $derived.by(() => {
		if (invalid) {
			return 'border border-red-500 bg-red-50 text-gray-700 hover:bg-red-50 focus-visible:ring-red-500';
		}
		if (size === 'chip' && selected) {
			return 'border border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:ring-blue-500';
		}
		if (active) {
			return 'bg-blue-100 text-gray-900 focus-visible:ring-blue-500';
		}
		if (selected && (appearance === 'bare' || appearance === 'ghost')) {
			return 'bg-transparent text-menu-selected hover:bg-gray-100 focus-visible:ring-blue-500';
		}
		if (tone === 'neutral' && (appearance === 'bare' || appearance === 'ghost') && emphasis !== 'default') {
			return `bg-transparent focus-visible:ring-blue-500 ${emphasisClasses[emphasis]}`;
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
	class="inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {alignClasses[
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
