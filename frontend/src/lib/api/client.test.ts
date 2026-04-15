import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchJson } from './client';

describe('fetchJson', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns undefined for 201 with no body', async () => {
		fetchSpy.mockResolvedValue({
			ok: true,
			status: 201,
			headers: { get: () => null }, // no content-type
			json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
		} as unknown as Response);

		const result = await fetchJson<void>('/api/push/subscribe', { method: 'POST' });
		expect(result).toBeUndefined();
	});
});
