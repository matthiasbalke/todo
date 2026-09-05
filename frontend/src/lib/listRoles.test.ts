import { describe, expect, it } from 'vitest';
import { formatListRole } from './listRoles';

describe('formatListRole', () => {
	it.each([
		['OWNER', 'Owner'],
		['EDITOR', 'Editor'],
		['VIEWER', 'Viewer']
	] as const)('formats %s as %s', (role, label) => {
		expect(formatListRole(role)).toBe(label);
	});
});
