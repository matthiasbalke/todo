import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	auditedNativeControls,
	nativeControlExceptions,
	primitiveExclusions,
	showcaseExclusions
} from './nativeControlInventory';

const sourceRoot = resolve(process.cwd(), 'src');
const excluded = new Set<string>([...primitiveExclusions, ...showcaseExclusions]);
const replaceableControl =
	/<button\b|<select\b|<textarea\b|<input\b(?=[^>]*\btype\s*=\s*["'](?:text|email)["'])|<input\b(?![^>]*\btype\s*=)/g;

function svelteFiles(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const path = resolve(directory, entry);
		return statSync(path).isDirectory() ? svelteFiles(path) : path.endsWith('.svelte') ? [path] : [];
	});
}

describe('native control inventory', () => {
	it('records the audited migration baseline', () => {
		expect(auditedNativeControls).toEqual({
			selects: 5,
			textOrEmailInputs: 14,
			buttons: 82,
			total: 101
		});
	});

	it('rejects replaceable native controls in production consumers', () => {
		const invalidExceptions = nativeControlExceptions.filter(
			(exception) => !exception.path || !exception.line || !exception.element || !exception.reason.trim()
		);
		expect(invalidExceptions, 'Every native-control exception must include path, line, element, and reason').toEqual([]);

		const violations: string[] = [];
		for (const file of svelteFiles(sourceRoot)) {
			const path = relative(sourceRoot, file);
			if (excluded.has(path)) continue;

			const source = readFileSync(file, 'utf8');
			for (const match of source.matchAll(replaceableControl)) {
				const line = source.slice(0, match.index).split('\n').length;
				const exception = nativeControlExceptions.find(
					(item) => item.path === path && item.line === line && match[0].startsWith(`<${item.element}`)
				);
				if (!exception) violations.push(`${path}:${line}: ${match[0]}`);
			}
		}

		expect(violations, `Replace native controls with shared components:\n${violations.join('\n')}`).toEqual([]);
	});
});
