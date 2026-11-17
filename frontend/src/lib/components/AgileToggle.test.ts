import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ enabled: true, selected: false, saving: false, set: vi.fn() }));
vi.mock('$lib/stores/preferences.svelte', () => ({ getProfile: () => ({ agileViewEnabled: state.enabled }) }));
vi.mock('$lib/stores/agile.svelte', () => ({ isAgileSelected: () => state.selected, isAgileSaving: () => state.saving, setAgileSelection: state.set }));
import AgileToggle from './AgileToggle.svelte';
afterEach(cleanup);
beforeEach(() => { state.enabled = true; state.selected = false; state.saving = false; state.set.mockReset(); });
it('provides personal selection independent of source editing capability', async () => {
  render(AgileToggle, { itemId: 'readable-viewer-item' });
  const button = screen.getByRole('button', { name: 'Plan in Agile' });
  expect(button).toHaveAttribute('aria-pressed','false');
  await fireEvent.click(button); expect(state.set).toHaveBeenCalledWith('readable-viewer-item',true);
});
it('hides disabled feature and shows a retryable write error', async () => {
  state.enabled = false; render(AgileToggle,{itemId:'a'}); expect(screen.queryByRole('button')).toBeNull(); cleanup();
  state.enabled = true; state.selected = true; state.set.mockRejectedValue(new Error('failed')); render(AgileToggle,{itemId:'a'});
  await fireEvent.click(screen.getByRole('button')); expect(await screen.findByRole('alert')).toHaveTextContent('retry');
  expect(state.set).toHaveBeenCalledWith('a',false);
});
