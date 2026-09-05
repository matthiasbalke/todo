import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadListPrefs, saveListPrefs, deleteListPrefs } from './listPrefs';
import type { ListPrefs } from './listPrefs';

const defaultPrefs: ListPrefs = {
  sortField: 'ALPHA',
  sortDirection: 'DESC',
  starredOnly: true,
  hideFuture: false,
  hideUndated: true,
  assigneeFilters: [],
};

function makeLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
    removeItem: vi.fn((k: string) => { delete store[k]; }),
    clear: vi.fn(() => { for (const k in store) delete store[k]; }),
    store,
  };
}

describe('loadListPrefs', () => {
  it('returns null when nothing is saved', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    expect(loadListPrefs('list-1')).toBeNull();
  });

  it('returns parsed prefs after saveListPrefs wrote them', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListPrefs('list-1', defaultPrefs);
    expect(loadListPrefs('list-1')).toEqual(defaultPrefs);
  });

  it('normalizes legacy single assigneeFilter values', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    const { assigneeFilters: _assigneeFilters, ...legacyPrefs } = defaultPrefs;
    ls.setItem('todo_list_prefs_list-1', JSON.stringify({ ...legacyPrefs, assigneeFilter: 'me' }));

    expect(loadListPrefs('list-1')?.assigneeFilters).toEqual(['me']);
  });

  it('normalizes malformed assignee values to inactive', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ls.setItem('todo_list_prefs_list-1', JSON.stringify({ ...defaultPrefs, assigneeFilters: ['invalid'] }));

    expect(loadListPrefs('list-1')?.assigneeFilters).toEqual([]);
  });

  it('normalizes all assignee criteria to inactive', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ls.setItem('todo_list_prefs_list-1', JSON.stringify({ ...defaultPrefs, assigneeFilters: ['none', 'me', 'others'] }));

    expect(loadListPrefs('list-1')?.assigneeFilters).toEqual([]);
  });

  it('returns null (not throw) when localStorage.getItem throws', () => {
    const ls = makeLocalStorage();
    ls.getItem.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => loadListPrefs('list-1')).not.toThrow();
    expect(loadListPrefs('list-1')).toBeNull();
  });
});

describe('hideDone field', () => {
  it('round-trips hideDone: true', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    const prefs: ListPrefs = { ...defaultPrefs, hideDone: true };
    saveListPrefs('list-1', prefs);
    expect(loadListPrefs('list-1')?.hideDone).toBe(true);
  });

  it('hideDone is undefined when not saved (backward compat)', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListPrefs('list-1', defaultPrefs); // no hideDone field
    expect(loadListPrefs('list-1')?.hideDone).toBeUndefined();
  });
});

describe('saveListPrefs', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage());
  });

  it('writes correct JSON under key todo_list_prefs_<id>', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    saveListPrefs('abc', defaultPrefs);
    expect(ls.setItem).toHaveBeenCalledWith('todo_list_prefs_abc', JSON.stringify(defaultPrefs));
  });

  it('saving for list A does not affect prefs for list B', () => {
    saveListPrefs('list-a', defaultPrefs);
    expect(loadListPrefs('list-b')).toBeNull();
  });

  it('does not throw when localStorage.setItem throws', () => {
    const ls = makeLocalStorage();
    ls.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => saveListPrefs('list-1', defaultPrefs)).not.toThrow();
  });
});

describe('deleteListPrefs', () => {
  it('removes the entry so load returns null', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListPrefs('list-1', defaultPrefs);
    deleteListPrefs('list-1');
    expect(loadListPrefs('list-1')).toBeNull();
  });

  it('does not throw when removeItem throws', () => {
    const ls = makeLocalStorage();
    ls.removeItem.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => deleteListPrefs('list-1')).not.toThrow();
  });
});
