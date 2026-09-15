/** One document-scroll owner for an existing item editor. */
export function itemEditorScroll(
	form: HTMLElement,
	options: { enabled: boolean; spacer?: HTMLElement | null }
) {
	let active: HTMLElement | null = null;
	let suspended = false;
	let frame = 0;
	let pointer: { id: number; x: number; y: number; canceled: boolean } | null = null;
	let canceledClick = false;
	let reserved = 0;
	const viewport = window.visualViewport;
	const scroller = document.scrollingElement ?? document.documentElement;
	const listeners: (() => void)[] = [];

	function listen(target: EventTarget, name: string, handler: EventListener, capture = false) {
		target.addEventListener(name, handler, { capture, passive: true });
		listeners.push(() => target.removeEventListener(name, handler, capture));
	}
	function cancel() {
		cancelAnimationFrame(frame);
		frame = 0;
	}
	function suspend() {
		suspended = true;
		cancel();
	}
	function field(target: EventTarget | null) {
		if (!(target instanceof Element) || !form.contains(target)) return null;
		// Toggles share the title row, but do not activate title editing.
		if (target.closest('[data-item-edit-field="title"]') && !target.closest('input')) return null;
		return target.closest<HTMLElement>('[data-item-edit-field]');
	}
	function schedule() {
		if (viewport && Math.abs(viewport.scale - 1) > 0.01) { suspend(); return; }
		if (!options.enabled || suspended || pointer || !active || frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (!active?.isConnected || suspended || !options.enabled) return;
			const delta = active.getBoundingClientRect().top - (viewport?.offsetTop ?? 0) - 96;
			if (Math.abs(delta) <= 2) return;
			const target = Math.max(0, scroller.scrollTop + delta);
			const missing = target - Math.max(0, scroller.scrollHeight - scroller.clientHeight);
			if (options.spacer && missing > 0) {
				// Probe past blank space absorbed by the page's viewport min-height,
				// then trim the measured surplus before painting. Never shrink an
				// earlier reservation when switching fields or dismissing the keyboard.
				const probe = reserved + Math.ceil(missing) + scroller.clientHeight;
				options.spacer.style.height = `${probe}px`;
				const surplus = Math.max(0, scroller.scrollHeight - scroller.clientHeight - target);
				reserved = Math.max(reserved, Math.ceil(probe - surplus));
				options.spacer.style.height = `${reserved}px`;
			}
			// Apply the measured correction to the document scroll owner.
			scroller.scrollTop = target;
		});
	}
	function activate(next: HTMLElement | null) {
		active = next;
		suspended = false;
		cancel();
		schedule();
	}
	listen(document, 'pointerdown', ((event: PointerEvent) => {
		cancel();
		if (pointer || !event.isPrimary) { suspend(); }
		pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, canceled: !event.isPrimary };
		canceledClick = false;
	}) as EventListener, true);
	listen(document, 'pointermove', ((event: PointerEvent) => {
		if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8) {
			pointer.canceled = true;
			suspend();
		}
	}) as EventListener, true);
	listen(document, 'pointercancel', (() => {
		pointer = null;
		canceledClick = true;
		suspend();
	}) as EventListener, true);
	listen(document, 'pointerup', (() => {
		canceledClick = pointer?.canceled ?? false;
		pointer = null;
	}) as EventListener, true);
	listen(document, 'click', ((event: MouseEvent) => {
		if (canceledClick) { canceledClick = false; return; }
		const target = event.target as Element;
		if (target instanceof Element && target.closest('[role="listbox"], [role="dialog"]')) return;
		activate(field(target));
	}) as EventListener, true);
	listen(document, 'focusin', ((event: FocusEvent) => {
		if (pointer) return;
		const next = field(event.target);
		if (next !== active) activate(next);
	}) as EventListener);
	listen(document, 'wheel', suspend);
	listen(document, 'keydown', ((event: KeyboardEvent) => {
		const target = event.target as Element;
		if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"], [role="listbox"], [role="dialog"]')) return;
		if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) suspend();
	}) as EventListener);
	listen(window, 'resize', schedule);
	if (viewport) {
		listen(viewport, 'resize', schedule);
		listen(viewport, 'scroll', schedule);
	}
	return {
		update(next: typeof options) {
			options = next;
			if (!next.enabled) { active = null; suspend(); }
		},
		destroy() {
			cancel();
			listeners.forEach((remove) => remove());
			if (options.spacer) options.spacer.style.height = '';
		}
	};
}
