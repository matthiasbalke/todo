import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AgileItemDto } from '$lib/api/agile';
const state = vi.hoisted(() => ({ enabled: true, entries: [] as AgileItemDto[], error: '', loading: false, save: vi.fn(), refresh: vi.fn().mockResolvedValue(undefined) }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/preferences.svelte', () => ({ getProfile: () => ({ agileViewEnabled: state.enabled }) }));
vi.mock('$lib/stores/auth.svelte', () => ({ getCurrentUser: () => ({ id:'planner' }) }));
vi.mock('$lib/stores/agile.svelte', () => ({
  getAgileEntries: () => state.entries, isAgileLoading: () => state.loading, isAgileSaving: () => false,
  getAgileError: () => state.error, refreshAgile: state.refresh, saveAgileOrder: state.save,
  isAgileSelected: () => true, setAgileSelection: vi.fn()
}));
vi.mock('$lib/stores/items.svelte', () => ({ toggleDone: vi.fn(), toggleStarred: vi.fn(), deleteItem: vi.fn() }));
vi.mock('svelte-dnd-action', () => ({
  SHADOW_ITEM_MARKER_PROPERTY_NAME:'__shadow',
  dragHandleZone: vi.fn(() => ({ update:vi.fn(),destroy:vi.fn() })), dragHandle:vi.fn(() => ({destroy:vi.fn()}))
}));
import AgilePage from './+page.svelte';
import { goto } from '$app/navigation';
function entry(id: string, done = false, role: 'OWNER' | 'VIEWER' = 'OWNER'): AgileItemDto {
  return { id, listId:`list-${id}`, categoryId:null,title:`Task ${id}`,notes:null,done,starred:false,dueDate:null,
    recurrenceRule:null,parentItemId:null,createdByUserId:null,updatedByUserId:null,assignedUsers:[],sortOrder:0,
    createdAt:'2026-01-01',updatedAt:'2026-01-01',sourceListName:`Source ${id}`,sourceListEmoji:null,sourceListRole:role,
    sourceListGroupOrder:null,sourceListOrder:null,sourceCategoryName:null,sourceCategoryColor:null,sourceCategoryOrder:null };
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); state.enabled=true; state.entries=[entry('a'),entry('b',true),entry('c',false,'VIEWER')];state.error='';state.loading=false; state.save.mockResolvedValue(undefined); });
afterEach(cleanup);
it('preserves flat cross-list order and source capabilities with checked entries below unfinished', () => {
  const { container } = render(AgilePage);
  expect([...container.querySelectorAll('[data-agile-id]')].map(e=>e.getAttribute('data-agile-id'))).toEqual(['a','c','b']);
  expect(screen.getByRole('link',{name:/Source c/})).toHaveAttribute('href','/lists/list-c');
  expect(screen.getByRole('link',{name:'Task c'})).toHaveAttribute('href','/lists/list-c/items/c?returnTo=%2Fagile');
  const viewer = container.querySelector('[data-agile-id="c"]') as HTMLElement;
  expect(within(viewer).queryByRole('button',{name:/Mark done/})).toBeNull();
  expect(within(viewer).getByRole('button',{name:'Plan in Agile'})).toBeEnabled();
  expect(screen.getAllByRole('button',{name:/Mark done/})).toHaveLength(1);
});
it('keeps unfinished movement enabled with Hide checked and saves its user preference', async () => {
  const { container } = render(AgilePage);
  await fireEvent.click(screen.getByRole('checkbox',{name:'Hide checked'}));
  expect(screen.queryByText('Task b')).toBeNull();
  expect(localStorage.getItem('agile:planner:hideChecked')).toBe('true');
  await fireEvent.click(screen.getByRole('button',{name:'Move Task c up'}));
  expect(state.save).toHaveBeenCalledWith(['c','a']);
  expect(container.querySelectorAll('[data-agile-id]')).toHaveLength(2);
  await fireEvent.click(screen.getByRole('checkbox',{name:'Hide checked'}));
  expect(screen.getByText('Task b')).toBeVisible();
});
it('supports keyboard movement and restores handle focus', async () => {
  render(AgilePage);
  const handle=screen.getByRole('button',{name:'Move Task c'});
  await fireEvent.keyDown(handle,{key:'ArrowUp',altKey:true});
  expect(state.save).toHaveBeenCalledWith(['c','a']);
  expect(await screen.findByRole('status')).toHaveTextContent('saved');
  expect(handle).toHaveFocus();
});
it('redirects disabled access and offers empty, loading and retry states', async () => {
  state.enabled=false;state.entries=[];render(AgilePage);expect(goto).toHaveBeenCalledWith('/lists');cleanup();
  state.enabled=true;render(AgilePage);expect(screen.getByText(/Your plan is empty/)).toBeVisible();cleanup();
  state.loading=true;render(AgilePage);expect(screen.getByText('Loading…')).toBeVisible();cleanup();
  state.loading=false;state.error='Could not load Agile.';render(AgilePage);await fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  expect(state.refresh).toHaveBeenCalled();
});
