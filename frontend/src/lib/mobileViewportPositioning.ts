import { getPrimaryScrollElement } from './appScroller';

const MOBILE_MAX_WIDTH = 767;
const DEFAULT_IGNORE_SELECTOR = '[role="listbox"], [role="grid"]';
const positionedEvents = new WeakSet<Event>();

export interface MobileViewportPositioningOptions {
	enabled?: boolean;
	ignoreSelector?: string;
	targetOffset?: number;
	deferredPointerTarget?: string;
}

export function isMobileViewport(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches ?? window.innerWidth <= MOBILE_MAX_WIDTH;
}

export function positionNearVisibleViewport(node: HTMLElement, targetOffset = 96): void {
	if (!isMobileViewport()) return;
	const scroller = getPrimaryScrollElement();
	if (!scroller) return;
	const visibleTop = window.visualViewport?.offsetTop ?? 0;
	scroller.scrollTop += node.getBoundingClientRect().top - (visibleTop + targetOffset);
}

export function mobileViewportPositioning(
	node: HTMLElement,
	{
		enabled = true,
		ignoreSelector = DEFAULT_IGNORE_SELECTOR,
		targetOffset = 96,
		deferredPointerTarget
	}: MobileViewportPositioningOptions = {}
) {
	const shouldIgnore = (target: EventTarget | null) =>
		target instanceof Element && Boolean(target.closest(ignoreSelector));
	const position = (event: Event) => {
		if (!enabled || shouldIgnore(event.target) || positionedEvents.has(event)) return;
		positionedEvents.add(event);
		positionNearVisibleViewport(node, targetOffset);
		if (
			event.type === 'pointerdown' &&
			deferredPointerTarget &&
			event.target instanceof Element &&
			event.target.closest(deferredPointerTarget)
		) {
			window.setTimeout(() => positionNearVisibleViewport(node, targetOffset), 250);
		}
	};
	const pointerOptions = { capture: true };
	node.addEventListener('pointerdown', position, pointerOptions);
	node.addEventListener('focusin', position);
	return {
		destroy() {
			node.removeEventListener('pointerdown', position, pointerOptions);
			node.removeEventListener('focusin', position);
		}
	};
}
