import { describe, expect, it } from 'vitest';

describe('item detail page loader', () => {
	it('should not include mock users in page data', async () => {
		const { load } = await import('./+page');
		const result = load({ params: { id: 'list-1', iid: 'item-1' } } as any);
		expect(result).not.toHaveProperty('users');
		expect(result).toMatchObject({ id: 'list-1', iid: 'item-1' });
	});
});
