import { afterEach, describe, expect, it, vi } from 'vitest';
import { mobileViewportPositioning, positionNearVisibleViewport } from './mobileViewportPositioning';
import { setAppScrollElement } from './appScroller';

const rect = (top: number) => ({ x: 0, y: top, top, left: 0, right: 100, bottom: top + 20, width: 100, height: 20, toJSON: () => {} });

afterEach(() => {
	setAppScrollElement(null);
	vi.unstubAllGlobals();
	document.body.replaceChildren();
});

function setMobile(matches = true) {
	vi.stubGlobal('matchMedia', vi.fn(() => ({ matches })));
}

describe('mobileViewportPositioning', () => {
	it('positions an owner relative to the visual viewport offset on mobile', () => {
		setMobile();
		vi.stubGlobal('visualViewport', { offsetTop: 24 });
		const scroller = document.createElement('main');
		const node = document.createElement('div');
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 10 });
		node.getBoundingClientRect = () => rect(400);
		setAppScrollElement(scroller);

		positionNearVisibleViewport(node);

		expect(scroller.scrollTop).toBe(290);
	});

	it('falls back to the document scroller when no app scroller is registered', () => {
		setMobile();
		const node = document.createElement('div');
		const documentScroller = document.documentElement;
		Object.defineProperty(documentScroller, 'scrollTop', { configurable: true, writable: true, value: 0 });
		node.getBoundingClientRect = () => rect(300);

		positionNearVisibleViewport(node);

		expect(documentScroller.scrollTop).toBe(204);
	});

	it('does not reposition on desktop or when disabled', () => {
		setMobile(false);
		const scroller = document.createElement('main');
		const node = document.createElement('div');
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 0 });
		node.getBoundingClientRect = () => rect(300);
		setAppScrollElement(scroller);
		const desktopAction = mobileViewportPositioning(node);
		node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		desktopAction.destroy();
		setMobile();
		const disabledAction = mobileViewportPositioning(node, { enabled: false });
		node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		disabledAction.destroy();

		expect(scroller.scrollTop).toBe(0);
	});

	it('ignores listbox and calendar-grid interactions', () => {
		setMobile();
		const scroller = document.createElement('main');
		const node = document.createElement('div');
		const listbox = document.createElement('div');
		const option = document.createElement('button');
		const grid = document.createElement('div');
		const day = document.createElement('button');
		listbox.setAttribute('role', 'listbox');
		grid.setAttribute('role', 'grid');
		listbox.append(option);
		grid.append(day);
		node.append(listbox, grid);
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 0 });
		node.getBoundingClientRect = () => rect(300);
		setAppScrollElement(scroller);
		const action = mobileViewportPositioning(node);
		option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		day.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		action.destroy();

		expect(scroller.scrollTop).toBe(0);
	});
});
