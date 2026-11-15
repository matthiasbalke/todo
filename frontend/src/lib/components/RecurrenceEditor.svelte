<script lang="ts">
	import type { RecurrenceRule } from '$lib/mock-data';
	import { editorFromRule, recurrenceError, recurrenceOptions, ruleFromEditor, WEEKDAYS, weekdayLabel, type RecurrenceEditorState, type Weekday } from '$lib/recurrence';
	import { recurrenceRuleToHuman } from '$lib/utils';
	import Select from './Select.svelte';
	import TextInput from './TextInput.svelte';
	import Dialog from './Dialog.svelte';
	import { untrack } from 'svelte';

	let { value = $bindable<RecurrenceEditorState>(editorFromRule(null)), rule = null, standalone = false, consumeOutsidePointer = true, inlineOptions = false, onapply, onbasic, onopenchange }:
		{ value?: RecurrenceEditorState; rule?: RecurrenceRule | null; standalone?: boolean; consumeOutsidePointer?: boolean; inlineOptions?: boolean; onapply: (rule: RecurrenceRule | null) => void; onbasic?: () => void; onopenchange?: (open: boolean) => void } = $props();
	let open = $state(false);
	let root = $state<HTMLDivElement>();
	let stagingWeekdays = $state(untrack(() => value.mode === 'WEEKDAYS' || value.weekdays.length > 0));
	const error = $derived(recurrenceError(value));
	const editorId = $props.id();
	const errorId = `${editorId}-error`;
	const modeOptions = recurrenceOptions.map(option => option.value);
	const label = (mode: string) => recurrenceOptions.find(option => option.value === mode)?.label ?? mode;
	const summary = () => rule ? recurrenceRuleToHuman(rule) : standalone ? 'set recurrence' : 'No recurrence';

	function apply() {
		if (!recurrenceError(value)) onapply(ruleFromEditor(value));
	}
	function selectMode(mode: string) {
		if (mode !== value.mode) {
			value = mode === 'CUSTOM' ? { mode, amount: '1', unit: 'DAYS', weekdays: [] }
				: mode === 'WEEKDAYS' ? { mode, amount: '1', unit: 'WEEKS', weekdays: [] }
				: { ...editorFromRule(null), mode };
			stagingWeekdays = mode === 'WEEKDAYS';
		}
		if (mode === 'CUSTOM' || mode === 'WEEKDAYS') {
			if (standalone) { open = true; onopenchange?.(true); }
		} else {
			if (open) close();
			else apply();
			onbasic?.();
		}
	}
	function close() {
		apply();
		open = false;
		onopenchange?.(false);
	}
	function toggleDay(day: Weekday) {
		stagingWeekdays = true;
		value = { ...value, weekdays: value.weekdays.includes(day) ? value.weekdays.filter(value => value !== day) : [...value.weekdays, day] };
	}
</script>

{#snippet modeSelect(inDialog: boolean)}
	<Select {inlineOptions} {consumeOutsidePointer} options={modeOptions} selected={value.mode} ariaLabel="Recurrence" getOptionLabel={label}
		getSelectedLabel={inDialog ? label : summary} isSelectedMuted={() => !rule} onSelect={selectMode} />
{/snippet}

{#snippet controls()}
	{@render modeSelect(true)}
	{#if value.mode === 'CUSTOM'}
		<TextInput label="Repeat every" ariaLabel="Repeat every" value={value.amount} inputmode="numeric"
			aria-describedby={error ? errorId : undefined}
			oninput={(event) => { value = { ...value, amount: event.currentTarget.value }; }}
			onblur={() => { if (!stagingWeekdays) apply(); }}
			onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (!stagingWeekdays) apply(); } }} />
		<Select {inlineOptions} {consumeOutsidePointer} options={['DAYS', 'WEEKS', 'MONTHS', 'YEARS']} selected={value.unit} ariaLabel="Repeat unit"
			getOptionLabel={(unit) => unit.toLowerCase()}
			onSelect={(unit) => {
				value = { ...value, unit, weekdays: unit === 'WEEKS' ? value.weekdays : [] };
				if (unit !== 'WEEKS') stagingWeekdays = false;
				if (!stagingWeekdays) apply();
			}} />
	{/if}
	{#if value.mode === 'WEEKDAYS' || (value.mode === 'CUSTOM' && value.unit === 'WEEKS')}
		<fieldset aria-describedby={error ? errorId : undefined} class="space-y-2">
			<legend class="text-sm text-supporting">{value.mode === 'WEEKDAYS' ? 'Repeat on' : 'Repeat on (optional)'}</legend>
			<div class="flex flex-wrap gap-2">
				{#each WEEKDAYS as day}
					<label class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm">
						<input type="checkbox" checked={value.weekdays.includes(day)} onchange={() => toggleDay(day)} />
						{weekdayLabel(day)}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}
	{#if error}<p id={errorId} role="alert" class="text-sm text-danger">{error}</p>{/if}
{/snippet}

{#if standalone}
	<div bind:this={root}>
		{@render modeSelect(false)}
		{#if error && !open}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
	</div>
	{#if open}
		<Dialog title="Recurrence" onclose={close} returnFocusTo={root?.querySelector('input')} showFooter={false}>
			{@render controls()}
		</Dialog>
	{/if}
{:else}
	{@render controls()}
{/if}
