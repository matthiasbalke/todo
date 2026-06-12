export type CalendarDate = {
	year: number;
	month: number;
	day: number;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function fromDate(date: Date): CalendarDate {
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate()
	};
}

export function toDate(value: CalendarDate): Date {
	return new Date(value.year, value.month - 1, value.day, 12);
}

export function parseIsoDate(value: string | null | undefined): CalendarDate | null {
	if (!value) return null;
	const match = ISO_DATE_PATTERN.exec(value);
	if (!match) return null;

	const parsed = {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3])
	};
	const date = toDate(parsed);

	return date.getFullYear() === parsed.year &&
		date.getMonth() + 1 === parsed.month &&
		date.getDate() === parsed.day
		? parsed
		: null;
}

export function toIsoDate(value: CalendarDate): string {
	return `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(
		value.day
	).padStart(2, '0')}`;
}

export function compareDates(left: CalendarDate, right: CalendarDate): number {
	return toIsoDate(left).localeCompare(toIsoDate(right));
}

export function addDays(value: CalendarDate, amount: number): CalendarDate {
	const date = toDate(value);
	date.setDate(date.getDate() + amount);
	return fromDate(date);
}

export function addMonths(value: CalendarDate, amount: number): CalendarDate {
	const targetMonth = new Date(value.year, value.month - 1 + amount, 1, 12);
	const lastDay = new Date(
		targetMonth.getFullYear(),
		targetMonth.getMonth() + 1,
		0,
		12
	).getDate();

	return {
		year: targetMonth.getFullYear(),
		month: targetMonth.getMonth() + 1,
		day: Math.min(value.day, lastDay)
	};
}

export function startOfWeek(value: CalendarDate): CalendarDate {
	const day = toDate(value).getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	return addDays(value, mondayOffset);
}

export function createMonthGrid(year: number, month: number): CalendarDate[] {
	const first = startOfWeek({ year, month, day: 1 });
	return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

export function isDateAllowed(
	value: CalendarDate,
	min: CalendarDate | null,
	max: CalendarDate | null
): boolean {
	if (min && compareDates(value, min) < 0) return false;
	if (max && compareDates(value, max) > 0) return false;
	return true;
}

export function formatCalendarDate(
	value: CalendarDate,
	locale: string | undefined,
	options: Intl.DateTimeFormatOptions
): string {
	return new Intl.DateTimeFormat(locale, options).format(toDate(value));
}

export function todayCalendarDate(): CalendarDate {
	return fromDate(new Date());
}
