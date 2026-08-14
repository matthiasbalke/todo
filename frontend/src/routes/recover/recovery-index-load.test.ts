import { describe, expect, it } from 'vitest';

import { load, ssr } from './+page';

describe('recovery index load', () => {
	it('runs only in the browser', () => {
		expect(ssr).toBe(false);
	});

	it('shows the recovery-link error instead of a blank route 404', async () => {
		await expect(async () => load({} as never)).rejects.toMatchObject({
			status: 404,
			body: {
				message: 'Recovery link is invalid or expired.',
			},
		});
	});
});
