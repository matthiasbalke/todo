export const sharedControlNames = [
	'Button',
	'CalendarDayButton',
	'ColorSwatchButton',
	'CompletionToggle',
	'DatePicker',
	'EditableLabel',
	'EmailInput',
	'ListStateSummary',
	'Select',
	'StarToggle',
	'SwipeDeleteAction',
	'Textarea',
	'TextInput',
	'Toggle'
] as const;

export const legacyVisualProps = ['variant', 'triggerClass', 'inputClass', 'displayClass', 'labelClass'] as const;

export const semanticStylingAudit = {
	auditedAt: '2026-06-12',
	buttonUsagesBeforeComposition: 84,
	bareButtonUsagesBeforeMigration: 66,
	ghostUsagesOutsideShowcaseBeforeMigration: 0,
	legacyButtonMappings: {
		primary: { tone: 'primary', appearance: 'solid' },
		secondary: { tone: 'neutral', appearance: 'outline' },
		danger: { tone: 'danger', appearance: 'solid' },
		ghost: { tone: 'neutral', appearance: 'ghost' },
		bare: { tone: 'neutral', appearance: 'bare' }
	},
	legacyVisualHookConsumers: {
		triggerClass: 5,
		inputClass: 2,
		displayClass: 2,
		labelClass: 0
	}
} as const;

export interface SpecializedStylingException {
	path: string;
	line: number;
	component: string;
	control: string;
	reason: string;
	followUp: 'extract-specialized-interaction-controls';
}

export const specializedStylingExceptions: ReadonlyArray<SpecializedStylingException> = [];

const visualUtility =
	/^(?:bg|text|border|rounded|shadow|ring|outline|fill|stroke|font|tracking|leading|p[trblxy]?|gap|divide|transition|duration|ease|animate|decoration|resize|scale|rotate)(?:-|$)|^(?:italic|not-italic|uppercase|lowercase|capitalize|normal-case|underline|line-through|truncate|antialiased)$/;

const layoutUtility =
	/^(?:w|min-w|max-w|h|min-h|max-h|m[trblxy]?|space-[xy]|inset|inset-[xy]|top|right|bottom|left|z|basis|order|translate-[xy])(?:-|$)|^(?:flex|inline-flex|grid|block|inline-block|hidden|grow|shrink|relative|absolute|fixed|sticky|overflow-hidden|overflow-auto|pointer-events-none|cursor-default)$/;

export function baseUtility(token: string): string {
	const normalized = token.replace(/^!/, '');
	const parts = normalized.split(':');
	return parts[parts.length - 1] ?? normalized;
}

export function isVisualUtility(token: string): boolean {
	return visualUtility.test(baseUtility(token));
}

export function isAllowedLayoutUtility(token: string): boolean {
	const base = baseUtility(token);
	return layoutUtility.test(base) || /^(?:flex|grid|self|place|items|justify|content)-/.test(base) || /^opacity-/.test(base);
}

export function classTokens(value: string): string[] {
	const dynamicClassValues = [...value.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]).join(' ');
	const staticClassValue = value.replace(/\{[^}]*\}/g, ' ');
	return `${staticClassValue} ${dynamicClassValues}`
		.split(/\s+/)
		.map((token) => token.trim().replace(/[,;)]$/, ''))
		.filter((token) => /^!?[a-z]/.test(token));
}

export function forbiddenClassTokens(value: string): string[] {
	return [...new Set(classTokens(value).filter((token) => !isAllowedLayoutUtility(token)))];
}

export function isValidSpecializedException(exception: {
	path?: string;
	line?: number;
	component?: string;
	control?: string;
	reason?: string;
	followUp?: string;
}): boolean {
	return Boolean(
		exception.path?.endsWith('.svelte') &&
			exception.line &&
			exception.line > 0 &&
			exception.component &&
			exception.control &&
			exception.reason?.trim() &&
			exception.followUp === 'extract-specialized-interaction-controls'
	);
}
