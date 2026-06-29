import { describe, expect, it, vi } from 'vitest';
import {
  deleteListGroupState,
  loadListGroupState,
  saveListGroupState,
  UNGROUPED_LIST_GROUP_STATE_KEY,
} from './listGroupState';
import type { ListGroupState } from './listGroupState';

const sampleState: ListGroupState = {
  collapsed: {
    'group-home': true,
    [UNGROUPED_LIST_GROUP_STATE_KEY]: true,
  },
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

describe('loadListGroupState', () => {
  it('returns null when nothing is saved', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    expect(loadListGroupState()).toBeNull();
  });

  it('round-trips saved state', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListGroupState(sampleState);
    expect(loadListGroupState()).toEqual(sampleState);
  });

  it('uses the overview list group storage key', () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    saveListGroupState(sampleState);
    expect(ls.setItem).toHaveBeenCalledWith('todo_list_group_state', JSON.stringify(sampleState));
  });

  it('exposes a reserved key for the virtual Ungrouped section', () => {
    expect(UNGROUPED_LIST_GROUP_STATE_KEY).toBe('__ungrouped__');
  });

  it('returns null and does not throw when getItem throws', () => {
    const ls = makeLocalStorage();
    ls.getItem.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => loadListGroupState()).not.toThrow();
    expect(loadListGroupState()).toBeNull();
  });
});

describe('saveListGroupState', () => {
  it('does not throw when setItem throws', () => {
    const ls = makeLocalStorage();
    ls.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => saveListGroupState(sampleState)).not.toThrow();
  });
});

describe('deleteListGroupState', () => {
  it('removes the entry so load returns null', () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    saveListGroupState(sampleState);
    deleteListGroupState();
    expect(loadListGroupState()).toBeNull();
  });

  it('does not throw when removeItem throws', () => {
    const ls = makeLocalStorage();
    ls.removeItem.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('localStorage', ls);
    expect(() => deleteListGroupState()).not.toThrow();
  });
});
