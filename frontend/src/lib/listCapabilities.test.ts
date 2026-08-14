import { describe, expect, it } from 'vitest';
import { getListCapabilities } from './listCapabilities';

describe('getListCapabilities', () => {
	it.each([
		['OWNER', true, true, true, true, true],
		['EDITOR', true, true, false, false, false],
		['VIEWER', false, false, false, false, false],
	] as const)(
		'maps %s to the complete capability matrix',
		(role, canEditItems, canManageCategories, canEditList, canDuplicateList, canManageMembers) => {
			expect(getListCapabilities(role)).toEqual({
				canEditItems,
				canManageCategories,
				canEditList,
				canDuplicateList,
				canManageMembers,
			});
		},
	);
});
