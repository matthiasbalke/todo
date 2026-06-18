export const auditedNativeControls = {
	selects: 5,
	textOrEmailInputs: 14,
	buttons: 82,
	total: 101
} as const;

export const primitiveExclusions = [
	'lib/components/Button.svelte',
	'lib/components/CalendarDayButton.svelte',
	'lib/components/ColorSwatchButton.svelte',
	'lib/components/CompletionToggle.svelte',
	'lib/components/DatePicker.svelte',
	'lib/components/EditableLabel.svelte',
	'lib/components/EmailInput.svelte',
	'lib/components/Select.svelte',
	'lib/components/StarToggle.svelte',
	'lib/components/Textarea.svelte',
	'lib/components/TextInput.svelte',
	'lib/components/Toggle.svelte'
] as const;

export const showcaseExclusions = ['routes/components/+page.svelte'] as const;

export const approvedUnmatchedNativeElements = [
	'a',
	'form',
	'fieldset',
	'legend',
	'label',
	'input[type=checkbox]',
	'input[type=radio]',
	'input[type=file]',
	'input[type=number]',
	'input[type=search]',
	'input[type=password]',
	'input[type=range]'
] as const;

export const nativeControlExceptions: ReadonlyArray<{
	path: string;
	line: number;
	element: string;
	reason: string;
}> = [];
