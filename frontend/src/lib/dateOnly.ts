export const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function localIsoDate(date = new Date()): string {
	return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
	const match = ISO_DATE_PATTERN.exec(value);
	if (!match) return null;
	const parts = {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3])
	};
	const date = dateOnlyToLocalDate(value);
	if (!date) return null;
	return date.getFullYear() === parts.year &&
		date.getMonth() + 1 === parts.month &&
		date.getDate() === parts.day
		? parts
		: null;
}

export function dateOnlyToLocalDate(value: string): Date | null {
	const match = ISO_DATE_PATTERN.exec(value);
	if (!match) return null;
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

export function compareDateOnly(left: string, right: string): number {
	return left.localeCompare(right);
}

export function compareOptionalDateOnly(left: string | null, right: string | null): number {
	if (left && right) return compareDateOnly(left, right);
	if (left) return -1;
	if (right) return 1;
	return 0;
}

export function addDaysToDateOnly(value: string, amount: number): string {
	const date = dateOnlyToLocalDate(value);
	if (!date) return value;
	date.setDate(date.getDate() + amount);
	return localIsoDate(date);
}

export function addMonthsToDateOnly(value: string, amount: number): string {
	const date = dateOnlyToLocalDate(value);
	if (!date) return value;
	date.setMonth(date.getMonth() + amount);
	return localIsoDate(date);
}

export function daysBetweenDateOnly(left: string, right: string): number {
	const leftParts = parseIsoDateParts(left);
	const rightParts = parseIsoDateParts(right);
	if (!leftParts || !rightParts) return Number.NaN;
	const leftUtc = Date.UTC(leftParts.year, leftParts.month - 1, leftParts.day);
	const rightUtc = Date.UTC(rightParts.year, rightParts.month - 1, rightParts.day);
	return (leftUtc - rightUtc) / (1000 * 60 * 60 * 24);
}

export function formatDateOnly(
	value: string,
	locale: string | undefined = 'en-US',
	options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
	const date = dateOnlyToLocalDate(value);
	if (!date) return value;
	return date.toLocaleDateString(locale, options);
}
