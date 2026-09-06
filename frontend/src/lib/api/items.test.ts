import { describe, expect, it, vi } from 'vitest';

const mockAuthedFetch = vi.hoisted(() => vi.fn());

vi.mock('./authedClient', () => ({
	authedFetch: mockAuthedFetch,
}));

import { deleteFinishedItems } from './items';

describe('items API client', () => {
	it('deleteFinishedItems sends a DELETE request to the list finished-items endpoint', async () => {
		mockAuthedFetch.mockResolvedValue(undefined);

		await deleteFinishedItems('list-1');

		expect(mockAuthedFetch).toHaveBeenCalledWith('/api/lists/list-1/items/finished', {
			method: 'DELETE',
		});
	});
});
