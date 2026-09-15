import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { itemEditorScroll } from './itemEditorScroll';

describe('item editor document alignment', () => {
	let form: HTMLFormElement;
	let title: HTMLInputElement;
	let category: HTMLInputElement;
	let spacer: HTMLDivElement;
	let viewport: EventTarget & { offsetTop: number; height: number; scale: number };
	let coordinator: ReturnType<typeof itemEditorScroll>;
	let scrollTop: number;
	let writes: number;
	function pointer(type: string, target: Element = category, extras = {}) {
		const event = new Event(type, { bubbles: true });
		Object.assign(event, { pointerId: 1, isPrimary: true, clientX: 10, clientY: 10, ...extras });
		target.dispatchEvent(event);
	}
	function frame() { vi.advanceTimersByTime(20); }
	function click(target = category) {
		pointer('pointerdown', target);
		target.focus({ preventScroll: true });
		pointer('pointerup', target);
		target.click();
		frame();
	}
	beforeEach(() => {
		vi.useFakeTimers();
		form = document.createElement('form');
		form.innerHTML = '<div data-item-edit-field="title"><input></div><div data-item-edit-field="category"><input><div role="listbox"><button type="button">Option</button></div></div>';
		[title, category] = [...form.querySelectorAll('input')];
		spacer = document.createElement('div');
		document.body.append(form, spacer);
		viewport = Object.assign(new EventTarget(), { offsetTop: 0, height: 800, scale: 1 });
		vi.stubGlobal('visualViewport', viewport);
		scrollTop = 0;
		writes = 0;
		vi.spyOn(document.documentElement, 'scrollTop', 'get').mockImplementation(() => scrollTop);
		vi.spyOn(document.documentElement, 'scrollTop', 'set').mockImplementation((value) => {
			writes++;
			scrollTop = Math.min(value, Number.parseFloat(spacer.style.height) || 0);
		});
		vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockImplementation(() => 800 + (Number.parseFloat(spacer.style.height) || 0));
		vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800);
		for (const [index, input] of [title, category].entries()) {
			vi.spyOn(input.parentElement!, 'getBoundingClientRect').mockImplementation(() => ({ top: 200 + 400 * index - scrollTop } as DOMRect));
		}
		coordinator = itemEditorScroll(form, { enabled: true, spacer });
	});
	afterEach(() => {
		coordinator.destroy();
		document.body.replaceChildren();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});
	it.each(['mouse', 'touch'])('waits for completed %s activation and coalesces focus', (pointerType) => {
		pointer('pointerdown', category, { pointerType });
		category.focus();
		frame();
		expect(writes).toBe(0);
		pointer('pointerup', category, { pointerType });
		category.click();
		frame();
		expect(scrollTop).toBe(504);
		expect(writes).toBe(1);
		expect(spacer.style.height).toBe('504px');
	});
	it('measures blank space absorbed by a minimum-height page for the first title activation', () => {
		vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockImplementation(() => Math.max(800, 400 + (Number.parseFloat(spacer.style.height) || 0)));
		vi.spyOn(document.documentElement, 'scrollTop', 'set').mockImplementation((value) => {
			scrollTop = Math.min(value, Math.max(0, document.documentElement.scrollHeight - 800));
		});
		title.focus(); frame();
		expect(scrollTop).toBe(104);
		expect(spacer.style.height).toBe('504px');
	});
	it('aligns keyboard focus and replaces queued earlier fields', () => {
		title.focus();
		category.focus();
		frame();
		expect(scrollTop).toBe(504);
		expect(writes).toBe(1);
	});
	it('discards canceled and dragged gestures', () => {
		pointer('pointerdown'); category.focus(); pointer('pointercancel'); frame();
		expect(writes).toBe(0);
		pointer('pointerdown'); pointer('pointermove', category, { clientY: 60 });
		pointer('pointerup'); category.click(); frame();
		expect(writes).toBe(0);
	});
	it('responds to delayed keyboard events, retains reservation and stops within tolerance', () => {
		click();
		viewport.offsetTop = 40;
		viewport.height = 350;
		viewport.dispatchEvent(new Event('resize'));
		viewport.dispatchEvent(new Event('scroll'));
		frame();
		expect(scrollTop).toBe(464);
		expect(spacer.style.height).toBe('504px');
		viewport.dispatchEvent(new Event('scroll')); frame();
		expect(writes).toBe(2);
		viewport.offsetTop = 41;
		viewport.dispatchEvent(new Event('scroll')); frame();
		expect(writes).toBe(2);
		viewport.offsetTop = 0;
		category.blur();
		viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(504);
		click(title);
		expect(scrollTop).toBe(104);
		expect(spacer.style.height).toBe('504px');
	});
	it('preserves manual scroll until a fresh tap even on the same input', () => {
		click();
		document.dispatchEvent(new Event('wheel'));
		scrollTop = 200;
		viewport.dispatchEvent(new Event('scroll')); frame();
		expect(scrollTop).toBe(200);
		click();
		expect(scrollTop).toBe(504);
	});
	it('cancels an already queued correction when pinch zoom begins', () => {
		category.focus();
		viewport.scale = 2;
		viewport.dispatchEvent(new Event('resize'));
		frame();
		expect(writes).toBe(0);
	});
	it('suspends pinch zoom and page keys but not caret or popup navigation', () => {
		click();
		viewport.scale = 2;
		viewport.dispatchEvent(new Event('resize')); frame();
		viewport.scale = 1; scrollTop = 200;
		viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(200);
		click();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
		scrollTop = 200; viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(200);
		click();
		category.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		viewport.offsetTop = 20; viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(484);
	});
	it('keeps option clicks and programmatic calendar focus within the same activation', () => {
		click();
		document.dispatchEvent(new Event('wheel'));
		scrollTop = 200;
		const button = form.querySelector('button')!;
		button.focus(); button.click(); category.focus(); frame();
		expect(scrollTop).toBe(200);
	});
	it('supports window fallback and top boundary, and cleans up pending work', () => {
		coordinator.destroy();
		vi.stubGlobal('visualViewport', undefined);
		coordinator = itemEditorScroll(form, { enabled: true, spacer });
		title.focus(); frame();
		expect(scrollTop).toBe(104);
		vi.mocked(title.parentElement!.getBoundingClientRect).mockReturnValue({ top: 40 } as DOMRect);
		window.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(48);
		category.focus();
		coordinator.destroy(); frame();
		expect(scrollTop).toBe(48);
		expect(spacer.style.height).toBe('');
	});
	it('disables background work for notes and quick add', () => {
		click();
		coordinator.update({ enabled: false, spacer });
		scrollTop = 200; viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(200);
		coordinator.update({ enabled: true, spacer });
		viewport.dispatchEvent(new Event('resize')); frame();
		expect(scrollTop).toBe(200);
		click(); expect(scrollTop).toBe(504);
	});
});
