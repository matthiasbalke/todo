import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEALTH_CHECK_TIMEOUT_MS, checkHealth } from './health';

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
		expect(fetchSpy).toHaveBeenCalledWith(
			'/actuator/health',
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
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

	it('uses the provided fetch implementation', async () => {
		const customFetch = vi.fn().mockResolvedValue({ status: 200 } as Response);

		const result = await checkHealth(customFetch as unknown as typeof fetch);

		expect(result).toBe(true);
		expect(customFetch).toHaveBeenCalledWith(
			'/actuator/health',
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns false after the health timeout aborts the request', async () => {
		vi.useFakeTimers();
		const hangingFetch = vi.fn(
			(_url: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				}),
		);

		const resultPromise = checkHealth(hangingFetch as unknown as typeof fetch);
		await vi.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);

		await expect(resultPromise).resolves.toBe(false);
		expect(hangingFetch).toHaveBeenCalledWith(
			'/actuator/health',
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		vi.useRealTimers();
	});
});
