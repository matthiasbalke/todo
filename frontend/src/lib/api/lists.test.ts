import { describe, expect, it, vi } from 'vitest';

const mockAuthedFetch = vi.hoisted(() => vi.fn());

vi.mock('./authedClient', () => ({
	authedFetch: mockAuthedFetch
}));

import { getMemberSuggestions } from './lists';

describe('lists API client', () => {
	it('getMemberSuggestions fetches the member suggestions endpoint', async () => {
		mockAuthedFetch.mockResolvedValue([]);

		await getMemberSuggestions('list-1');

		expect(mockAuthedFetch).toHaveBeenCalledWith('/api/lists/list-1/members/suggestions');
	});
});
