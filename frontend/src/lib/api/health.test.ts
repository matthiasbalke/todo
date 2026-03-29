import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkHealth } from './health';

describe('health API client', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns true on status 200', async () => {
		fetchSpy.mockResolvedValue({ status: 200 } as Response);

		const result = await checkHealth();

		expect(result).toBe(true);
	});

	it('returns false on status 503', async () => {
		fetchSpy.mockResolvedValue({ status: 503 } as Response);

		const result = await checkHealth();

		expect(result).toBe(false);
	});

	it('returns false when fetch rejects (network error)', async () => {
		fetchSpy.mockRejectedValue(new Error('Network error'));

		const result = await checkHealth();

		expect(result).toBe(false);
	});
});
