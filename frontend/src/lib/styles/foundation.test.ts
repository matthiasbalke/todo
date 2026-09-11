import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'foundation.css'), 'utf8');

describe('theme foundation tokens', () => {
	it('defines dark-theme semantic tokens for shared app surfaces and controls', () => {
		const darkBlock = css.match(/:root\[data-theme="dark"\]\s*\{(?<content>[\s\S]*?)\n\}/)?.groups?.content;
		expect(darkBlock).toBeTruthy();

		for (const token of [
			'--ui-canvas',
			'--ui-surface',
			'--ui-value',
			'--ui-heading',
			'--ui-border',
			'--ui-focus-primary',
			'--ui-success',
			'--ui-danger',
			'--ui-menu-selected',
			'--ui-placeholder',
		]) {
			expect(darkBlock).toContain(token);
		}
	});
});
