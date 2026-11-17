import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgileItemDto } from '$lib/api/agile';
import { ApiError } from '$lib/api/client';
const mocks = vi.hoisted(() => ({ get: vi.fn(), select: vi.fn(), reorder: vi.fn(), account: 'u1', enabled: true }));
vi.mock('$lib/api/agile', () => ({ getAgileItems: mocks.get, selectAgileItem: mocks.select, reorderAgile: mocks.reorder }));
vi.mock('./auth.svelte', () => ({ getCurrentUser: () => mocks.account ? { id: mocks.account } : null }));
vi.mock('./preferences.svelte', () => ({ getProfile: () => ({ id: mocks.account, agileViewEnabled: mocks.enabled }) }));
import { resetAgile, loadAgile, refreshAgile, getAgileEntries, getAgileCount, setAgileSelection, saveAgileOrder, getAgileError } from './agile.svelte';
const entry = (id: string, done = false) => ({ id, done, title: id }) as AgileItemDto;
beforeEach(() => { vi.clearAllMocks(); mocks.account = 'u1'; mocks.enabled = true; resetAgile(); mocks.get.mockResolvedValue([entry('a'), entry('b', true), entry('c')]); });
describe('personal Agile state', () => {
  it('skips disabled fetches and deduplicates initial loads', async () => {
    mocks.enabled = false; await loadAgile(); expect(mocks.get).not.toHaveBeenCalled();
    mocks.enabled = true; await Promise.all([loadAgile(), loadAgile()]); await loadAgile();
    expect(mocks.get).toHaveBeenCalledTimes(1); expect(getAgileCount()).toBe(2);
  });
  it('keeps confirmed state after failed selection and reconciles successful selection', async () => {
    await loadAgile(); mocks.select.mockRejectedValueOnce(new Error('offline'));
    await expect(setAgileSelection('a', false)).rejects.toThrow(); expect(getAgileEntries().map(e => e.id)).toEqual(['a','b','c']);
    mocks.select.mockResolvedValue({ selected: false, count: 1 }); mocks.get.mockResolvedValue([entry('b',true),entry('c')]);
    await setAgileSelection('a',false); expect(getAgileCount()).toBe(1);
  });
  it('fills unfinished slots and rolls back failed reorders', async () => {
    await loadAgile(); mocks.reorder.mockResolvedValue(undefined); mocks.get.mockResolvedValue([entry('c'),entry('b',true),entry('a')]); await saveAgileOrder(['c','a']);
    expect(getAgileEntries().map(e => e.id)).toEqual(['c','b','a']);
    mocks.reorder.mockRejectedValue(new Error('failed')); await expect(saveAgileOrder(['a','c'])).rejects.toThrow();
    expect(getAgileEntries().map(e => e.id)).toEqual(['c','b','a']);
  });
  it('refreshes conflicts and exposes an actionable error', async () => {
    await loadAgile(); mocks.reorder.mockRejectedValue(new ApiError(409,'stale')); mocks.get.mockResolvedValue([entry('x')]);
    await expect(saveAgileOrder(['c','a'])).rejects.toThrow();
    expect(getAgileEntries().map(e => e.id)).toEqual(['x']); expect(getAgileError()).toContain('retry');
  });
  it('clears logout and ignores a previous account response', async () => {
    let resolve!: (value: AgileItemDto[]) => void;
    mocks.get.mockReturnValue(new Promise<AgileItemDto[]>(r => { resolve = r; }));
    const pending = loadAgile(); mocks.account = 'u2'; expect(getAgileEntries()).toEqual([]);
    resolve([entry('secret')]); await pending; expect(getAgileEntries()).toEqual([]);
    mocks.account = ''; expect(getAgileCount()).toBe(0); expect(getAgileEntries()).toEqual([]);
  });
  it('reloads another session changes and allows retry after a failure', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline')); await expect(loadAgile()).rejects.toThrow();
    await refreshAgile(); expect(getAgileEntries()).toHaveLength(3);
    mocks.get.mockResolvedValue([entry('new')]); await refreshAgile(); expect(getAgileEntries()[0].id).toBe('new');
  });
});
