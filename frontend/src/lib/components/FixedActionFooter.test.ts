import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import FixedActionFooter from './FixedActionFooter.svelte';

const content = createRawSnippet(() => ({ render: () => '<button>Action</button>' }));

afterEach(cleanup);

describe('FixedActionFooter', () => {
	it('renders pinned action content with shared bottom surface styling', () => {
		const { container } = render(FixedActionFooter, { props: { children: content } });

		const footer = screen.getByTestId('fixed-action-footer');
		const inner = screen.getByTestId('fixed-action-footer-content');
		expect(footer).toHaveClass('fixed', 'bottom-0', 'border-t', 'bg-white', 'shadow-lg');
		expect(inner).toHaveClass('mx-auto', 'max-w-2xl', 'px-4', 'pt-3');
		expect(inner.className).toContain('pb-[calc(2rem+env(safe-area-inset-bottom))]');
		expect(container.querySelector('button')).toHaveTextContent('Action');
	});

	it('bounds expanded footer content in a scrollable area', () => {
		render(FixedActionFooter, { props: { expanded: true, children: content } });

		const scrollArea = screen.getByTestId('fixed-action-footer-scroll');
		expect(scrollArea).toHaveClass('overflow-y-auto');
		expect(scrollArea.className).toContain('max-h-[min(70vh,calc(100vh-2rem))]');
		expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
	});
});
