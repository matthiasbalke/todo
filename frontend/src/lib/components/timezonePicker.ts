type IntlWithSupportedValues = typeof Intl & {
	supportedValuesOf?: (key: 'timeZone') => string[];
};

interface TimezoneOptionConfig {
	selected?: string | null;
	detectedTimeZone?: string | null;
	supportedTimeZones?: string[] | null;
}

function humanizeSegment(segment: string): string {
	return segment.replaceAll('_', ' ');
}

export function formatTimeZoneLabel(timeZone: string): string {
	if (timeZone === 'UTC') return 'UTC';

	const segments = timeZone.split('/').map(humanizeSegment);
	if (segments.length === 1) return segments[0];

	const location = segments.at(-1);
	const region = segments.slice(0, -1).join(' / ');
	return `${location} (${region})`;
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
	if (!timeZone) return false;

	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format();
		return true;
	} catch {
		return false;
	}
}

export function detectBrowserTimeZone(): string | null {
	if (typeof window === 'undefined') return null;

	try {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return isValidTimeZone(timeZone) ? timeZone : null;
	} catch {
		return null;
	}
}

export function getSupportedTimeZones(): string[] | null {
	const supportedValuesOf = (Intl as IntlWithSupportedValues).supportedValuesOf;
	if (typeof supportedValuesOf !== 'function') return null;

	try {
		return supportedValuesOf.call(Intl, 'timeZone');
	} catch {
		return null;
	}
}

export function createTimeZoneOptions({
	selected = null,
	detectedTimeZone = detectBrowserTimeZone(),
	supportedTimeZones = getSupportedTimeZones()
}: TimezoneOptionConfig = {}): string[] {
	const timeZones = new Set<string>(['UTC']);

	for (const timeZone of supportedTimeZones ?? []) {
		if (timeZone) timeZones.add(timeZone);
	}

	if (isValidTimeZone(selected)) timeZones.add(selected);
	if (isValidTimeZone(detectedTimeZone)) timeZones.add(detectedTimeZone);

	return [...timeZones].sort((left, right) => {
		if (left === 'UTC') return -1;
		if (right === 'UTC') return 1;
		return formatTimeZoneLabel(left).localeCompare(formatTimeZoneLabel(right));
	});
}
