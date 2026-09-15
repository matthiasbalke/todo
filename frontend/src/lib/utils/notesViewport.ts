/** Keep modal chrome above the keyboard and restore background scroll on teardown. */
export function notesViewport(dialog: HTMLElement) {
	const viewport = window.visualViewport;
	const body = document.body;
	const scroller = document.scrollingElement ?? document.documentElement;
	const scrollTop = scroller.scrollTop;
	const scrollLeft = scroller.scrollLeft;
	const properties = ['position', 'top', 'left', 'width', 'overflow'] as const;
	const previous = properties.map((name) => [name, body.style.getPropertyValue(name), body.style.getPropertyPriority(name)]);
	const oldOverflow = document.documentElement.style.overflow;
	let frame = 0;
	Object.assign(body.style, { position: 'fixed', top: `${-scrollTop}px`, left: `${-scrollLeft}px`, width: '100%', overflow: 'hidden' });
	document.documentElement.style.overflow = 'hidden';
	function measure() {
		frame = 0;
		Object.assign(dialog.style, {
			top: `${viewport?.offsetTop ?? 0}px`,
			left: `${viewport?.offsetLeft ?? 0}px`,
			width: `${viewport?.width ?? window.innerWidth}px`,
			height: `${viewport?.height ?? window.innerHeight}px`
		});
	}
	function schedule() {
		if (!frame) frame = requestAnimationFrame(measure);
	}
	measure();
	window.addEventListener('resize', schedule);
	viewport?.addEventListener('resize', schedule);
	viewport?.addEventListener('scroll', schedule);
	return {
		destroy() {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', schedule);
			viewport?.removeEventListener('resize', schedule);
			viewport?.removeEventListener('scroll', schedule);
			for (const [name, value, priority] of previous) body.style.setProperty(name, value, priority);
			document.documentElement.style.overflow = oldOverflow;
			scroller.scrollTop = scrollTop;
			scroller.scrollLeft = scrollLeft;
		}
	};
}
