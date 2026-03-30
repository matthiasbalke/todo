import { describe, it, expect, vi } from 'vitest';
import { loadListCategoryState, saveListCategoryState } from './listCategoryState';
import type { ListCategoryState } from './listCategoryState';

const sampleState: ListCategoryState = {
  collapsed: { 'cat-1': true, '__null__': false },
  doneCollapsed: { 'cat-1': false, 'cat-2': true },
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

describe('loadListCategoryState', () => {
  it('returns null when nothing is saved', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    expect(loadListCategoryState('list-1')).toBeNull();
  });

  it('round-trip: saved state is restored correctly', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListCategoryState('list-1', sampleState);
    expect(loadListCategoryState('list-1')).toEqual(sampleState);
  });

  it('uses key todo_list_category_state_<id>', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    saveListCategoryState('abc', sampleState);
    expect(ls.setItem).toHaveBeenCalledWith('todo_list_category_state_abc', JSON.stringify(sampleState));
  });

  it('list A state does not affect list B', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListCategoryState('list-a', sampleState);
    expect(loadListCategoryState('list-b')).toBeNull();
  });

  it('returns null (not throw) when getItem throws', () => {
    const ls = makeLocalStorage();
    ls.getItem.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => loadListCategoryState('list-1')).not.toThrow();
    expect(loadListCategoryState('list-1')).toBeNull();
  });
});

describe('saveListCategoryState', () => {
  it('does not throw when setItem throws', () => {
    const ls = makeLocalStorage();
    ls.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => saveListCategoryState('list-1', sampleState)).not.toThrow();
  });
});
