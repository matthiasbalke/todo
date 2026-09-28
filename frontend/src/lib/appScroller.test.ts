import { afterEach, describe, expect, it } from 'vitest';
import { getAppScrollElement, getPrimaryScrollElement, setAppScrollElement } from './appScroller';

afterEach(() => {
	document.body.innerHTML = '';
	setAppScrollElement(null);
});

describe('app scroller helpers', () => {
	it('returns the explicitly registered app scroll element', () => {
		const element = document.createElement('main');
		const cleanup = setAppScrollElement(element);

		expect(getAppScrollElement()).toBe(element);
		expect(getPrimaryScrollElement()).toBe(element);

		cleanup();
		expect(getAppScrollElement()).not.toBe(element);
	});

	it('falls back to the app scroll container in the DOM', () => {
		const element = document.createElement('main');
		element.dataset.testid = 'app-scroll-container';
		document.body.appendChild(element);

		expect(getAppScrollElement()).toBe(element);
		expect(getPrimaryScrollElement()).toBe(element);
	});
});
