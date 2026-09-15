/** A save may release only the uninterrupted focus session that requested it. */
export function focusSession(root: HTMLElement) {
	let revision = 0;
	const changed = () => { revision += 1; };
	root.addEventListener('focusin', changed, true);
	root.addEventListener('focusout', changed, true);
	return {
		capture() {
			const origin = document.activeElement;
			const session = revision;
			return () => {
				if (revision === session && origin instanceof HTMLElement && root.contains(origin)
					&& document.activeElement === origin) origin.blur();
			};
		},
		destroy() {
			changed();
			root.removeEventListener('focusin', changed, true);
			root.removeEventListener('focusout', changed, true);
		}
	};
}
