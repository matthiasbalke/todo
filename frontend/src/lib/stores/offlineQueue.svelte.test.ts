import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/items', () => ({
	toggleItemDone: vi.fn(),
	toggleItemStarred: vi.fn(),
	reorderItems: vi.fn(),
}));

function makeLocalStorage() {
	const store: Record<string, string> = {};
	return {
		getItem: vi.fn((k: string) => store[k] ?? null),
		setItem: vi.fn((k: string, v: string) => {
			store[k] = v;
		}),
		removeItem: vi.fn((k: string) => {
			delete store[k];
		}),
		clear: vi.fn(() => {
			for (const k in store) delete store[k];
		}),
		store,
	};
}

let ls: ReturnType<typeof makeLocalStorage>;
let uuidCounter = 0;

beforeEach(() => {
	uuidCounter = 0;
	ls = makeLocalStorage();
	vi.stubGlobal('localStorage', ls);
	vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++uuidCounter}` });
	vi.clearAllMocks();
	vi.resetModules();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function getModule() {
	return import('$lib/stores/offlineQueue.svelte');
}

async function getApi() {
	return import('$lib/api/items');
}

// ---------------------------------------------------------------------------
// hasPending
// ---------------------------------------------------------------------------

describe('hasPending', () => {
	it('returns false on a fresh queue', async () => {
		const { hasPending } = await getModule();
		expect(hasPending()).toBe(false);
	});

	it('returns true after enqueue', async () => {
		const { enqueue, hasPending } = await getModule();
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		expect(hasPending()).toBe(true);
	});

	it('returns false after all mutations are flushed', async () => {
		const { enqueue, flushOfflineQueue, hasPending } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		await flushOfflineQueue();
		expect(hasPending()).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

describe('enqueue', () => {
	it('assigns a unique id and timestamp', async () => {
		const { enqueue } = await getModule();
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });

		const saved = JSON.parse(ls.store['offlineMutationQueue']);
		expect(saved[0].id).toBe('uuid-1');
		expect(saved[0].timestamp).toBeGreaterThan(0);
	});

	it('preserves all mutation fields', async () => {
		const { enqueue } = await getModule();
		enqueue({ type: 'reorder', listId: 'list-2', orderedIds: ['a', 'b', 'c'] });

		const saved = JSON.parse(ls.store['offlineMutationQueue']);
		expect(saved[0]).toMatchObject({ type: 'reorder', listId: 'list-2', orderedIds: ['a', 'b', 'c'] });
	});

	it('appends multiple mutations in order', async () => {
		const { enqueue } = await getModule();
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		enqueue({ type: 'toggleStarred', listId: 'list-1', itemId: 'item-2' });

		const saved = JSON.parse(ls.store['offlineMutationQueue']);
		expect(saved).toHaveLength(2);
		expect(saved[0].type).toBe('toggleDone');
		expect(saved[1].type).toBe('toggleStarred');
	});

	it('persists to localStorage key offlineMutationQueue', async () => {
		const { enqueue } = await getModule();
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		expect(ls.setItem).toHaveBeenCalledWith('offlineMutationQueue', expect.any(String));
	});

	it('does not throw when localStorage.setItem throws', async () => {
		ls.setItem.mockImplementation(() => {
			throw new Error('quota exceeded');
		});
		const { enqueue } = await getModule();
		expect(() => enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' })).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// localStorage persistence on load
// ---------------------------------------------------------------------------

describe('queue loaded from localStorage on startup', () => {
	it('restores a previously persisted queue', async () => {
		const persisted = [
			{ id: 'old-id', type: 'toggleDone', listId: 'list-1', itemId: 'item-1', timestamp: 1 },
		];
		ls.store['offlineMutationQueue'] = JSON.stringify(persisted);

		const { hasPending } = await getModule();
		expect(hasPending()).toBe(true);
	});

	it('starts with empty queue when localStorage has no entry', async () => {
		const { hasPending } = await getModule();
		expect(hasPending()).toBe(false);
	});

	it('starts with empty queue when localStorage contains invalid JSON', async () => {
		ls.store['offlineMutationQueue'] = 'not-json{{{';
		const { hasPending } = await getModule();
		expect(hasPending()).toBe(false);
	});

	it('starts with empty queue when localStorage.getItem throws', async () => {
		ls.getItem.mockImplementation(() => {
			throw new Error('blocked');
		});
		const { hasPending } = await getModule();
		expect(hasPending()).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// flushOfflineQueue — API dispatch
// ---------------------------------------------------------------------------

describe('flushOfflineQueue API dispatch', () => {
	it('calls toggleItemDone for toggleDone mutations', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		await flushOfflineQueue();

		expect(api.toggleItemDone).toHaveBeenCalledWith('list-1', 'item-1');
	});

	it('calls toggleItemStarred for toggleStarred mutations', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemStarred).mockResolvedValue({} as never);

		enqueue({ type: 'toggleStarred', listId: 'list-1', itemId: 'item-2' });
		await flushOfflineQueue();

		expect(api.toggleItemStarred).toHaveBeenCalledWith('list-1', 'item-2');
	});

	it('calls reorderItems with correct sortOrder for reorder mutations', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.reorderItems).mockResolvedValue(undefined as never);

		enqueue({ type: 'reorder', listId: 'list-1', orderedIds: ['a', 'b', 'c'] });
		await flushOfflineQueue();

		expect(api.reorderItems).toHaveBeenCalledWith('list-1', [
			{ id: 'a', sortOrder: 0 },
			{ id: 'b', sortOrder: 1 },
			{ id: 'c', sortOrder: 2 },
		]);
	});

	it('processes mutations in enqueue order', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		const callOrder: string[] = [];
		vi.mocked(api.toggleItemDone).mockImplementation(async (_, itemId) => {
			callOrder.push(itemId!);
			return {} as never;
		});
		vi.mocked(api.toggleItemStarred).mockImplementation(async (_, itemId) => {
			callOrder.push(itemId!);
			return {} as never;
		});

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'first' });
		enqueue({ type: 'toggleStarred', listId: 'list-1', itemId: 'second' });
		await flushOfflineQueue();

		expect(callOrder).toEqual(['first', 'second']);
	});
});

// ---------------------------------------------------------------------------
// flushOfflineQueue — queue management
// ---------------------------------------------------------------------------

describe('flushOfflineQueue queue management', () => {
	it('removes successfully processed mutations from the queue', async () => {
		const { enqueue, flushOfflineQueue, hasPending } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		await flushOfflineQueue();

		expect(hasPending()).toBe(false);
		expect(JSON.parse(ls.store['offlineMutationQueue'])).toHaveLength(0);
	});

	it('stops at first failure and keeps remaining mutations', async () => {
		const { enqueue, flushOfflineQueue, hasPending } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockRejectedValue(new TypeError('Failed to fetch'));
		vi.mocked(api.toggleItemStarred).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		enqueue({ type: 'toggleStarred', listId: 'list-1', itemId: 'item-2' });
		await flushOfflineQueue();

		expect(hasPending()).toBe(true);
		expect(api.toggleItemStarred).not.toHaveBeenCalled();
		const remaining = JSON.parse(ls.store['offlineMutationQueue']);
		expect(remaining).toHaveLength(2);
	});

	it('keeps only failed and subsequent mutations after a partial flush', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValueOnce({} as never).mockRejectedValueOnce(new TypeError('Failed to fetch'));

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-2' });
		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-3' });
		await flushOfflineQueue();

		const remaining = JSON.parse(ls.store['offlineMutationQueue']);
		expect(remaining).toHaveLength(2);
		expect(remaining[0].itemId).toBe('item-2');
		expect(remaining[1].itemId).toBe('item-3');
	});

	it('does nothing when queue is already empty', async () => {
		const { flushOfflineQueue } = await getModule();
		const api = await getApi();

		await flushOfflineQueue();

		expect(api.toggleItemDone).not.toHaveBeenCalled();
	});

	it('prevents concurrent flushes', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();

		let resolve!: () => void;
		vi.mocked(api.toggleItemDone).mockReturnValue(
			new Promise<never>((res) => {
				resolve = () => res({} as never);
			}),
		);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		const first = flushOfflineQueue();
		const second = flushOfflineQueue(); // should be a no-op
		resolve();
		await Promise.all([first, second]);

		expect(api.toggleItemDone).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// flushOfflineQueue — return value (affected list IDs)
// ---------------------------------------------------------------------------

describe('flushOfflineQueue return value', () => {
	it('returns an empty set when queue is empty', async () => {
		const { flushOfflineQueue } = await getModule();
		const result = await flushOfflineQueue();
		expect(result.size).toBe(0);
	});

	it('returns the listId of successfully flushed mutations', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-42', itemId: 'item-1' });
		const result = await flushOfflineQueue();

		expect(result.has('list-42')).toBe(true);
	});

	it('returns deduplicated list IDs when multiple mutations share a list', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockResolvedValue({} as never);
		vi.mocked(api.toggleItemStarred).mockResolvedValue({} as never);

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		enqueue({ type: 'toggleStarred', listId: 'list-1', itemId: 'item-2' });
		const result = await flushOfflineQueue();

		expect(result.size).toBe(1);
		expect(result.has('list-1')).toBe(true);
	});

	it('does not include listIds of mutations that failed', async () => {
		const { enqueue, flushOfflineQueue } = await getModule();
		const api = await getApi();
		vi.mocked(api.toggleItemDone).mockRejectedValue(new TypeError('Failed to fetch'));

		enqueue({ type: 'toggleDone', listId: 'list-1', itemId: 'item-1' });
		const result = await flushOfflineQueue();

		expect(result.size).toBe(0);
	});
});
