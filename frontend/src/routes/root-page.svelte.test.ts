import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn(),
}));

vi.mock('$lib/api/health', () => ({
	checkHealth: vi.fn(),
}));

import { invalidateAll } from '$app/navigation';
import { checkHealth } from '$lib/api/health';
import RootPage from './+page.svelte';

describe('root page startup surface', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		vi.mocked(checkHealth).mockResolvedValue(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	it('shows the startup indicator while the backend is unavailable', () => {
		render(RootPage);

		expect(screen.getByText(/Application is starting/i)).toBeInTheDocument();
	});

	it('retries health and invalidates the route after recovery', async () => {
		vi.mocked(checkHealth).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

		render(RootPage);
		await vi.advanceTimersByTimeAsync(2000);

		await waitFor(() => {
			expect(invalidateAll).toHaveBeenCalled();
		});
	});

	it('keeps polling when health recovers but route invalidation stays on startup', async () => {
		vi.mocked(checkHealth).mockResolvedValue(true);

		render(RootPage);
		await vi.advanceTimersByTimeAsync(2000);

		await waitFor(() => {
			expect(invalidateAll).toHaveBeenCalledTimes(2);
		});
	});

	it('skips overlapping health checks while a startup attempt is in flight', async () => {
		let resolveHealth!: (healthy: boolean) => void;
		vi.mocked(checkHealth).mockReturnValue(
			new Promise<boolean>((resolve) => {
				resolveHealth = resolve;
			}),
		);

		render(RootPage);
		await vi.advanceTimersByTimeAsync(6000);

		expect(checkHealth).toHaveBeenCalledTimes(1);
		resolveHealth(false);
		await vi.runOnlyPendingTimersAsync();
	});

	it('shows unavailable after the retry budget is exhausted', async () => {
		render(RootPage);
		await vi.advanceTimersByTimeAsync(120_000);

		await waitFor(() => {
			expect(screen.getByText(/Backend did not respond/i)).toBeInTheDocument();
		});
	});
});
