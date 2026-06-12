<script module lang="ts">
	let nextDatePickerId = 0;
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from './Button.svelte';
	import CalendarDayButton from './CalendarDayButton.svelte';
	import {
		addDays,
		addMonths,
		compareDates,
		createMonthGrid,
		formatCalendarDate,
		isDateAllowed,
		parseIsoDate,
		startOfWeek,
		todayCalendarDate,
		toIsoDate,
		type CalendarDate
	} from './datePicker';

	interface Props {
		value?: string | null;
		label?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		min?: string | null;
		max?: string | null;
		locale?: string;
		ariaLabel?: string;
	}

	let {
		value = $bindable(null),
		label = '',
		placeholder = 'Select a date',
		required = false,
		disabled = false,
		min = null,
		max = null,
		locale,
		ariaLabel
	}: Props = $props();

	let isOpen = $state(false);
	let containerElement = $state<HTMLElement>();
	let triggerElement = $state<HTMLButtonElement | null>(null);
	let displayedYear = $state(todayCalendarDate().year);
	let displayedMonth = $state(todayCalendarDate().month);
	let focusedDate = $state<CalendarDate>(todayCalendarDate());
	let dateButtons = $state<Record<string, HTMLButtonElement>>({});
	const instanceId = `datepicker-${nextDatePickerId++}`;
	const labelId = `${instanceId}-label`;

	const selectedDate = $derived(parseIsoDate(value));
	const minDate = $derived(parseIsoDate(min));
	const maxDate = $derived(parseIsoDate(max));
	const today = $derived(todayCalendarDate());
	const calendarDates = $derived(createMonthGrid(displayedYear, displayedMonth));
	const triggerText = $derived(
		selectedDate
			? formatCalendarDate(selectedDate, locale, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: placeholder
	);
	const monthHeading = $derived(
		formatCalendarDate({ year: displayedYear, month: displayedMonth, day: 1 }, locale, {
			year: 'numeric',
			month: 'long'
		})
	);
	const weekdayLabels = $derived(
		Array.from({ length: 7 }, (_, index) =>
			formatCalendarDate(addDays({ year: 2024, month: 1, day: 1 }, index), locale, {
				weekday: 'short'
			})
		)
	);

	function isAllowed(date: CalendarDate): boolean {
		return isDateAllowed(date, minDate, maxDate);
	}

	function findAllowedDate(start: CalendarDate, direction: 1 | -1): CalendarDate {
		let candidate = start;
		for (let index = 0; index < 3660; index += 1) {
			if (isAllowed(candidate)) return candidate;
			candidate = addDays(candidate, direction);
		}
		return start;
	}

	function initialFocusDate(): CalendarDate {
		if (selectedDate && isAllowed(selectedDate)) return selectedDate;
		if (isAllowed(today)) return today;

		const firstOfMonth = { year: displayedYear, month: displayedMonth, day: 1 };
		return findAllowedDate(firstOfMonth, minDate && compareDates(firstOfMonth, minDate) < 0 ? 1 : -1);
	}

	async function focusDate(date: CalendarDate) {
		focusedDate = date;
		displayedYear = date.year;
		displayedMonth = date.month;
		await tick();
		dateButtons[toIsoDate(date)]?.focus();
	}

	async function openCalendar() {
		if (disabled) return;
		const base = selectedDate ?? today;
		displayedYear = base.year;
		displayedMonth = base.month;
		focusedDate = initialFocusDate();
		isOpen = true;
		await tick();
		dateButtons[toIsoDate(focusedDate)]?.focus();
	}

	function closeCalendar(returnFocus = false) {
		isOpen = false;
		if (returnFocus) {
			tick().then(() => triggerElement?.focus());
		}
	}

	function toggleCalendar() {
		if (isOpen) {
			closeCalendar();
		} else {
			openCalendar();
		}
	}

	function selectDate(date: CalendarDate) {
		if (!isAllowed(date)) return;
		value = toIsoDate(date);
		closeCalendar(true);
	}

	function clearDate() {
		value = null;
		closeCalendar(true);
	}

	function selectToday() {
		if (isAllowed(today)) selectDate(today);
	}

	function changeMonth(amount: number) {
		const next = addMonths({ year: displayedYear, month: displayedMonth, day: 1 }, amount);
		displayedYear = next.year;
		displayedMonth = next.month;
		const preferred = addMonths(focusedDate, amount);
		focusedDate = isAllowed(preferred)
			? preferred
			: findAllowedDate(preferred, amount >= 0 ? 1 : -1);
		tick().then(() => dateButtons[toIsoDate(focusedDate)]?.focus());
	}

	function moveFocus(candidate: CalendarDate, direction: 1 | -1) {
		focusDate(isAllowed(candidate) ? candidate : findAllowedDate(candidate, direction));
	}

	function handleDateKeydown(event: KeyboardEvent, date: CalendarDate) {
		let candidate: CalendarDate | null = null;
		let direction: 1 | -1 = 1;

		switch (event.key) {
			case 'ArrowLeft':
				candidate = addDays(date, -1);
				direction = -1;
				break;
			case 'ArrowRight':
				candidate = addDays(date, 1);
				break;
			case 'ArrowUp':
				candidate = addDays(date, -7);
				direction = -1;
				break;
			case 'ArrowDown':
				candidate = addDays(date, 7);
				break;
			case 'Home':
				candidate = startOfWeek(date);
				direction = -1;
				break;
			case 'End':
				candidate = addDays(startOfWeek(date), 6);
				break;
			case 'PageUp':
				candidate = addMonths(date, -1);
				direction = -1;
				break;
			case 'PageDown':
				candidate = addMonths(date, 1);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				selectDate(date);
				return;
			case 'Escape':
				event.preventDefault();
				closeCalendar(true);
				return;
			default:
				return;
		}

		event.preventDefault();
		moveFocus(candidate, direction);
	}

	function handleDocumentPointer(event: MouseEvent) {
		if (isOpen && containerElement && !containerElement.contains(event.target as Node)) {
			closeCalendar();
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleDocumentPointer);
		return () => document.removeEventListener('mousedown', handleDocumentPointer);
	});
</script>

<div bind:this={containerElement} class="relative flex flex-col gap-1">
	{#if label}
		<span class="text-sm font-medium text-gray-700">
			<span id={labelId}>{label}</span>
			{#if required}<span class="text-red-500">*</span>{/if}
		</span>
	{/if}

	<Button
		bind:element={triggerElement}
		{disabled}
		aria-label={ariaLabel || (!label ? placeholder : undefined)}
		aria-labelledby={!ariaLabel && label ? labelId : undefined}
		aria-haspopup="dialog"
		aria-expanded={isOpen}
		onclick={toggleCalendar}
		tone="neutral"
		appearance="outline"
		size="field"
		align="between"
		weight="normal"
		class="w-full"
	>
		<span class={selectedDate ? 'text-gray-800' : 'text-gray-500 italic'}>{triggerText}</span>
		<span aria-hidden="true">▾</span>
	</Button>

	{#if isOpen}
		<div
			role="dialog"
			aria-label={label ? `${label} calendar` : 'Calendar'}
			class="absolute left-0 top-full z-50 mt-1 w-full min-w-72 max-w-sm rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
		>
			<div class="mb-3 flex items-center justify-between">
				<Button
					aria-label="Previous month"
					onclick={() => changeMonth(-1)}
					tone="neutral"
					appearance="ghost"
					size="icon"
				>
					‹
				</Button>
				<h3 class="text-sm font-semibold text-gray-800" aria-live="polite">{monthHeading}</h3>
				<Button
					aria-label="Next month"
					onclick={() => changeMonth(1)}
					tone="neutral"
					appearance="ghost"
					size="icon"
				>
					›
				</Button>
			</div>

			<div role="grid" aria-label={monthHeading} class="grid grid-cols-7 gap-1">
				{#each weekdayLabels as weekday}
					<div role="columnheader" class="py-1 text-center text-xs font-medium text-gray-500">
						{weekday}
					</div>
				{/each}

				{#each calendarDates as date (toIsoDate(date))}
					{@const iso = toIsoDate(date)}
					{@const allowed = isAllowed(date)}
					{@const selected = value === iso}
					{@const current = toIsoDate(today) === iso}
					{@const adjacent = date.month !== displayedMonth}
					<CalendarDayButton
						bind:element={dateButtons[iso]}
						value={iso}
						day={date.day}
						label={formatCalendarDate(date, locale, {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
						{selected}
						{current}
						{adjacent}
						disabled={!allowed}
						focused={toIsoDate(focusedDate) === iso}
						onclick={() => selectDate(date)}
						onkeydown={(event) => handleDateKeydown(event, date)}
					/>
				{/each}
			</div>

			<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
				<Button
					disabled={!isAllowed(today)}
					onclick={selectToday}
					tone="primary"
					appearance="bare"
					size="small"
				>
					Today
				</Button>
				<Button
					disabled={value === null}
					onclick={clearDate}
					tone="neutral"
					appearance="bare"
					size="small"
					emphasis="muted"
				>
					Clear
				</Button>
			</div>
		</div>
	{/if}
</div>
