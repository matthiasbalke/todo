/** Reveal a child without scrolling any ancestor of the panel. */
export function revealInPanel(panel: HTMLElement, child: HTMLElement) {
	const bounds = panel.getBoundingClientRect();
	const item = child.getBoundingClientRect();
	const top = bounds.top + panel.clientTop;
	const bottom = top + panel.clientHeight;
	if (item.top < top) panel.scrollTop += item.top - top;
	else if (item.bottom > bottom) panel.scrollTop += item.bottom - bottom;
}

/** Shared popups follow available visible space without owning document scroll. */
export function viewportPanel(panel: HTMLElement, preferredHeight = Infinity) {
	const viewport = window.visualViewport;
	let frame = 0;
	function measure() {
		frame = 0;
		const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
		panel.style.maxHeight = `${Math.max(0, Math.min(preferredHeight, bottom - panel.getBoundingClientRect().top - 8))}px`;
		const active = document.activeElement;
		const highlighted = panel.querySelector<HTMLElement>('[data-highlighted="true"]');
		if (active instanceof HTMLElement && panel.contains(active)) revealInPanel(panel, active);
		else if (highlighted) revealInPanel(panel, highlighted);
	}
	function schedule(event?: Event) {
		// A user scrolling this panel owns its scroll position. Only movement of
		// the viewport or an ancestor changes the space available to the popup.
		if (event?.target instanceof Node && panel.contains(event.target)) return;
		if (!frame) frame = requestAnimationFrame(measure);
	}
	measure();
	window.addEventListener('resize', schedule);
	// Document alignment can move the popup after it has opened.
	window.addEventListener('scroll', schedule, true);
	viewport?.addEventListener('resize', schedule);
	viewport?.addEventListener('scroll', schedule);
	return {
		destroy() {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', schedule);
			window.removeEventListener('scroll', schedule, true);
			viewport?.removeEventListener('resize', schedule);
			viewport?.removeEventListener('scroll', schedule);
		}
	};
}
