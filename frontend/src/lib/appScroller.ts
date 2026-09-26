let appScrollElement: HTMLElement | null = null;

export function setAppScrollElement(element: HTMLElement | null): () => void {
	appScrollElement = element;
	return () => {
		if (appScrollElement === element) appScrollElement = null;
	};
}

export function getAppScrollElement(): HTMLElement | null {
	if (appScrollElement) return appScrollElement;
	if (typeof document === 'undefined') return null;
	return document.querySelector<HTMLElement>('[data-testid="app-scroll-container"]');
}

export function getPrimaryScrollElement(): HTMLElement | Element | null {
	if (typeof document === 'undefined') return null;
	return getAppScrollElement() ?? document.scrollingElement ?? document.documentElement;
}
