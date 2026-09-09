<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import {
		appIcons,
		iconSizePresets,
		type AppIconName,
		type IconSizePresetName
	} from './iconRegistry';

	type IconTone = 'default' | 'muted' | 'menuSelected';

	interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'children' | 'class'> {
		name: AppIconName;
		size?: IconSizePresetName | number;
		strokeWidth?: number;
		tone?: IconTone;
		label?: string;
		decorative?: boolean;
		class?: string;
	}

	let {
		name,
		size = 'action',
		strokeWidth,
		tone = 'default',
		label = '',
		decorative = true,
		class: className = '',
		...restProps
	}: Props = $props();

	const toneClasses: Record<IconTone, string> = {
		default: '',
		muted: 'text-gray-300',
		menuSelected: 'text-menu-selected'
	};
	const toneClass = $derived(toneClasses[tone]);
	const classes = $derived([className, toneClass].filter(Boolean).join(' '));
	const IconComponent = $derived(appIcons[name]);
	const preset = $derived(typeof size === 'string' ? iconSizePresets[size] : null);
	const resolvedSize = $derived(preset?.size ?? size);
	const resolvedStrokeWidth = $derived(strokeWidth ?? preset?.strokeWidth ?? 2);
	const isDecorative = $derived(!label && decorative);
</script>

<IconComponent
	{...restProps}
	size={resolvedSize}
	strokeWidth={resolvedStrokeWidth}
	aria-hidden={isDecorative ? 'true' : undefined}
	aria-label={!isDecorative ? label : undefined}
	role={!isDecorative ? 'img' : undefined}
	class={classes}
/>
