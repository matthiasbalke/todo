import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	baseUtility,
	forbiddenClassTokens,
	isAllowedLayoutUtility,
	isValidSpecializedException,
	legacyVisualProps,
	semanticStylingAudit,
	sharedControlNames,
	specializedStylingExceptions
} from './sharedComponentStyling';

const sourceRoot = resolve(process.cwd(), 'src');
const showcasePath = 'routes/components/+page.svelte';
const sharedTag = new RegExp(`<(${sharedControlNames.join('|')})\\b[\\s\\S]*?>`, 'g');

function svelteFiles(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const path = resolve(directory, entry);
		return statSync(path).isDirectory() ? svelteFiles(path) : path.endsWith('.svelte') ? [path] : [];
	});
}

function lineAt(source: string, index: number): number {
	return source.slice(0, index).split('\n').length;
}

describe('shared component semantic styling', () => {
	it('records the migration audit and legacy semantic mappings', () => {
		expect(semanticStylingAudit).toMatchObject({
			buttonUsagesBeforeComposition: 84,
			bareButtonUsagesBeforeMigration: 66,
			ghostUsagesOutsideShowcaseBeforeMigration: 0
		});
		expect(semanticStylingAudit.legacyButtonMappings.danger).toEqual({
			tone: 'danger',
			appearance: 'solid'
		});
	});

	it.each([
		['w-full', true],
		['sm:opacity-0', true],
		['sm:group-hover:opacity-100', true],
		['flex-1', true],
		['min-w-0', true],
		['text-red-600', false],
		['hover:bg-red-50', false],
		['px-4', false],
		['rounded-lg', false],
		['focus:ring-[3px]', false]
	])('classifies %s as layout-only: %s', (utility, allowed) => {
		expect(isAllowedLayoutUtility(utility)).toBe(allowed);
	});

	it('normalizes responsive and state prefixes', () => {
		expect(baseUtility('sm:group-hover:text-red-500')).toBe('text-red-500');
		expect(baseUtility('focus:!ring-[3px]')).toBe('!ring-[3px]');
	});

	it('finds static, conditional, state-prefixed, and arbitrary visual utilities', () => {
		expect(
			forbiddenClassTokens(
				"w-full custom-class {selected ? 'text-red-600 hover:bg-red-50' : 'sm:border-gray-300'} focus:ring-[3px]"
			)
		).toEqual([
			'custom-class',
			'focus:ring-[3px]',
			'text-red-600',
			'hover:bg-red-50',
			'sm:border-gray-300'
		]);
	});

	it('requires narrow documented specialized exceptions', () => {
		expect(specializedStylingExceptions).toEqual([]);
		expect(specializedStylingExceptions.every(isValidSpecializedException)).toBe(true);
		for (const exception of specializedStylingExceptions) {
			const source = readFileSync(resolve(sourceRoot, exception.path), 'utf8');
			const line = source.split('\n')[exception.line - 1];
			expect(line, `${exception.path}:${exception.line}`).toContain(`<${exception.component}`);
		}
		expect(
			isValidSpecializedException({
				path: 'lib/components/ItemCard.svelte',
				line: 0,
				component: 'Button',
				control: '',
				reason: '',
				followUp: 'other-change'
			})
		).toBe(false);
	});

	it.each([
		'CalendarDayButton',
		'ColorSwatchButton',
		'CompletionToggle',
		'StarToggle',
		'SwipeDeleteAction'
	])('guards specialized control consumers: %s', (component) => {
		expect(sharedControlNames).toContain(component);
		const source = `<${component} class="text-red-600 rounded-full" style="color: red" />`;
		const match = [...source.matchAll(new RegExp(sharedTag.source, 'g'))][0];
		expect(match?.[1]).toBe(component);
		expect(forbiddenClassTokens(source)).toContain('text-red-600');
		expect(source).toMatch(/\bstyle\s*=/);
	});

	it('rejects visual styling and removed hooks on production shared-control consumers', () => {
		const violations: string[] = [];

		for (const file of svelteFiles(sourceRoot)) {
			const path = relative(sourceRoot, file);
			if (path === showcasePath || path === 'lib/components/Button.svelte') continue;

			const source = readFileSync(file, 'utf8');
			for (const match of source.matchAll(sharedTag)) {
				const tag = match[0];
				const component = match[1];
				const line = lineAt(source, match.index ?? 0);
				const exception = specializedStylingExceptions.find(
					(item) => item.path === path && item.line === line && item.component === component
				);

				for (const prop of legacyVisualProps) {
					if (new RegExp(`\\b${prop}\\s*=`).test(tag)) {
						violations.push(`${path}:${line}: <${component}> prop=${prop}: removed visual styling hook`);
					}
				}

				if (/\bstyle\s*=/.test(tag) && !exception) {
					violations.push(`${path}:${line}: <${component}> prop=style: inline visual styling is forbidden`);
				}

				const classMatch = tag.match(/\bclass\s*=\s*"([^"]*)"/);
				if (!classMatch || exception) continue;
				for (const utility of forbiddenClassTokens(classMatch[1])) {
					violations.push(`${path}:${line}: <${component}> prop=class utility=${utility}`);
				}
			}
		}

		expect(violations, `Use semantic shared-control props:\n${violations.join('\n')}`).toEqual([]);
	});
});
