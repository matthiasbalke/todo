import { afterEach, expect, it, vi } from 'vitest';
import { revealInPanel, viewportPanel } from './viewportPanel';
import { notesViewport } from './notesViewport';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren(); });

it('reveals options only inside the panel and constrains it after viewport changes', () => {
	vi.useFakeTimers();
	const viewport = Object.assign(new EventTarget(), { offsetTop: 20, height: 300 });
	vi.stubGlobal('visualViewport', viewport);
	const panel = document.createElement('div');
	const option = document.createElement('button');
	panel.append(option); document.body.append(panel);
	vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ top: 150 } as DOMRect);
	vi.spyOn(panel, 'clientHeight', 'get').mockReturnValue(100);
	vi.spyOn(option, 'getBoundingClientRect').mockReturnValue({ top: 280, bottom: 320 } as DOMRect);
	const documentScroll = vi.spyOn(document.documentElement, 'scrollTop', 'set');
	const action = viewportPanel(panel, 240);
	expect(panel.style.maxHeight).toBe('162px');
	revealInPanel(panel, option);
	expect(panel.scrollTop).toBe(70);
	expect(documentScroll).not.toHaveBeenCalled();
	viewport.height = 200;
	viewport.dispatchEvent(new Event('resize'));
	vi.advanceTimersByTime(20);
	expect(panel.style.maxHeight).toBe('62px');
	option.dataset.highlighted = 'true';
	panel.scrollTop = 0;
	panel.dispatchEvent(new Event('scroll'));
	vi.advanceTimersByTime(20);
	expect(panel.scrollTop).toBe(0);
	action.destroy();
	viewport.height = 400; viewport.dispatchEvent(new Event('resize'));
	vi.advanceTimersByTime(20);
	expect(panel.style.maxHeight).toBe('62px');
});

it('fits notes to viewport transitions and restores background position and styles on teardown', () => {
	vi.useFakeTimers();
	const viewport = Object.assign(new EventTarget(), { offsetTop: 30, offsetLeft: 0, height: 350, width: 390 });
	vi.stubGlobal('visualViewport', viewport);
	const dialog = document.createElement('div');
	document.body.append(dialog);
	document.body.style.setProperty('overflow', 'clip', 'important');
	document.documentElement.scrollTop = 200;
	const action = notesViewport(dialog);
	expect(dialog.style.top).toBe('30px');
	expect(dialog.style.height).toBe('350px');
	expect(document.body.style.position).toBe('fixed');
	expect(document.body.style.top).toBe('-200px');
	viewport.height = 600; viewport.offsetTop = 0;
	viewport.dispatchEvent(new Event('resize')); vi.advanceTimersByTime(20);
	expect(dialog.style.height).toBe('600px');
	expect(dialog.style.top).toBe('0px');
	document.documentElement.scrollTop = 0;
	action.destroy();
	expect(document.documentElement.scrollTop).toBe(200);
	expect(document.body.style.position).toBe('');
	expect(document.body.style.overflow).toBe('clip');
	expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
	document.body.style.overflow = '';
	document.documentElement.scrollTop = 0;
	viewport.height = 100; viewport.dispatchEvent(new Event('resize')); vi.advanceTimersByTime(20);
	expect(dialog.style.height).toBe('600px');
});

it('uses window geometry for notes when VisualViewport is absent', () => {
	vi.stubGlobal('visualViewport', undefined);
	const dialog = document.createElement('div');
	const action = notesViewport(dialog);
	expect(dialog.style.height).toBe(`${window.innerHeight}px`);
	expect(dialog.style.width).toBe(`${window.innerWidth}px`);
	action.destroy();
});
