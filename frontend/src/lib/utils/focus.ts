let keyboardBridge: HTMLInputElement | null = null;

export function primeMobileKeyboard(): () => void {
	if (typeof document === 'undefined') return () => {};
	keyboardBridge?.remove();
	const input = document.createElement('input');
	input.type = 'text';
	input.setAttribute('aria-hidden', 'true');
	input.tabIndex = -1;
	Object.assign(input.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '1px',
		height: '1px',
		opacity: '0',
		pointerEvents: 'none',
		fontSize: '16px',
		zIndex: '-1'
	});
	document.body.appendChild(input);
	keyboardBridge = input;
	input.focus({ preventScroll: true });

	return () => {
		if (keyboardBridge === input) keyboardBridge = null;
		input.remove();
	};
}

export function focusTextInput(
	input: HTMLInputElement | null,
	select = false,
	options: {
		scrollIntoView?: boolean;
		scrollBlock?: ScrollLogicalPosition;
		preventScroll?: boolean;
	} = {}
) {
	if (!input) return;
	const scrollBlock = options.scrollBlock ?? 'center';
	const preventScroll = options.preventScroll ?? true;
	if (options.scrollIntoView) {
		input.scrollIntoView?.({ block: scrollBlock, inline: 'nearest' });
	}
	input.focus({ preventScroll });
	if (select) input.select();
	requestAnimationFrame(() => {
		input.focus({ preventScroll });
		if (select) input.select();
		keyboardBridge?.remove();
		keyboardBridge = null;
	});
}
