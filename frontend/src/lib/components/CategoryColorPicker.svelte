<script module lang="ts">
	export function normalizeHexColor(value: string): string | null {
		const trimmed = value.trim();
		const shortMatch = /^#?([0-9a-fA-F]{3})$/.exec(trimmed);
		if (shortMatch) {
			return `#${shortMatch[1]
				.split('')
				.map((digit) => `${digit}${digit}`)
				.join('')
				.toUpperCase()}`;
		}

		const longMatch = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);
		return longMatch ? `#${longMatch[1].toUpperCase()}` : null;
	}
</script>

<script lang="ts">
	import Button from './Button.svelte';
	import ColorSwatchButton from './ColorSwatchButton.svelte';
	import TextInput from './TextInput.svelte';

	interface Props {
		value?: string | null;
		presets: string[];
		label?: string;
		showPreview?: boolean;
		onselect?: (color: string | null) => void;
	}

	let {
		value = $bindable<string | null>(null),
		presets,
		label = 'Category color',
		showPreview = true,
		onselect
	}: Props = $props();

	let customValue = $state(value ?? '');
	let error = $state<string | null>(null);

	$effect(() => {
		customValue = value ?? '';
		error = null;
	});

	function selectColor(color: string | null) {
		value = color;
		customValue = color ?? '';
		error = null;
		onselect?.(color);
	}

	function handleCustomInput() {
		if (!error) return;
		error = customValue.trim() && !normalizeHexColor(customValue) ? 'Enter a hex color like #60A5FA' : null;
	}

	function commitCustomColor() {
		if (!customValue.trim()) {
			selectColor(null);
			return;
		}

		const normalized = normalizeHexColor(customValue);
		if (!normalized) {
			error = 'Enter a hex color like #60A5FA';
			return;
		}

		selectColor(normalized);
	}
</script>

<div class="flex flex-col gap-1" aria-label={label}>
	<div class="flex flex-wrap items-center gap-1.5">
		{#if showPreview}
			<Button
				tone="neutral"
				appearance="bare"
				size="icon"
				class="h-7 w-7 flex-shrink-0"
				aria-label={`${label} no color`}
				aria-pressed={value === null}
				onclick={() => selectColor(null)}
			>
				{#if value}
					<span class="h-5 w-5 rounded-full" style="background-color: {value}"></span>
				{:else}
					<span class="h-5 w-5 rounded-full border border-dashed border-muted"></span>
				{/if}
			</Button>
		{/if}
		{#each presets as preset}
			<ColorSwatchButton
				color={preset}
				selected={value === preset}
				label={`${label} ${preset}`}
				onselect={selectColor}
			/>
		{/each}

		<div class="min-w-24 max-w-28 flex-1">
			<TextInput
				bind:value={customValue}
				size="compact"
				placeholder="#60A5FA"
				ariaLabel={`${label} custom hex`}
				oninput={handleCustomInput}
				onblur={commitCustomColor}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						commitCustomColor();
					}
				}}
			/>
		</div>
	</div>
	{#if error}
		<p class="typography-error">{error}</p>
	{/if}
</div>
