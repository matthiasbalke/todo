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

	it('shows the startup indicator while the backend is unavailable', async () => {
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

	it('shows unavailable after the retry budget is exhausted', async () => {
		vi.mocked(checkHealth).mockResolvedValue(false);

		render(RootPage);
		await vi.advanceTimersByTimeAsync(120_000);

		await waitFor(() => {
			expect(screen.getByText(/Backend did not respond/i)).toBeInTheDocument();
		});
	});
});
