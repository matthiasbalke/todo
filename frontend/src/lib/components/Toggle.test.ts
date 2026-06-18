import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Toggle from './Toggle.svelte';
import ToggleBinding from './test/ToggleBinding.svelte';

describe('Toggle', () => {
	it('renders accessible off and on switch states', async () => {
		const { rerender } = render(Toggle, { props: { ariaLabel: 'Example setting' } });
		const toggle = screen.getByRole('switch', { name: 'Example setting' });

		expect(toggle).toHaveAttribute('aria-checked', 'false');
		expect(toggle).toHaveClass('bg-gray-300');
		expect(toggle.firstElementChild).toHaveClass('translate-x-0');

		await rerender({ checked: true, ariaLabel: 'Example setting' });
		expect(toggle).toHaveAttribute('aria-checked', 'true');
		expect(toggle).toHaveClass('bg-blue-600');
		expect(toggle.firstElementChild).toHaveClass('translate-x-5');
	});

	it('updates bound state on pointer activation', async () => {
		render(ToggleBinding);
		const toggle = screen.getByRole('switch', { name: 'Bound setting' });

		expect(screen.getByText('off')).toBeInTheDocument();
		expect(screen.getByText('BUTTON')).toBeInTheDocument();
		await fireEvent.click(toggle);
		expect(screen.getByText('on')).toBeInTheDocument();
	});

	it.each(['Enter', ' '])('activates exactly once with %s', async (key) => {
		const onchange = vi.fn();
		render(Toggle, { props: { ariaLabel: 'Keyboard setting', onchange } });
		const toggle = screen.getByRole('switch', { name: 'Keyboard setting' });

		toggle.focus();
		await fireEvent.keyDown(toggle, { key });
		await fireEvent.keyUp(toggle, { key });
		// jsdom does not synthesize the native button click that browsers dispatch for Enter/Space.
		await fireEvent.click(toggle);

		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith(true);
		expect(toggle).toHaveAttribute('aria-checked', 'true');
	});

	it('forwards integration props and exposes focus', () => {
		render(Toggle, {
			props: {
				ariaLabel: 'Integrated setting',
				id: 'integrated-toggle',
				class: 'mt-2',
				title: 'Toggle title',
				tabindex: 2,
				'aria-describedby': 'toggle-help',
				'data-testid': 'integrated-toggle'
			}
		});
		const toggle = screen.getByRole('switch', { name: 'Integrated setting' });

		expect(toggle).toHaveAttribute('id', 'integrated-toggle');
		expect(toggle).toHaveClass('mt-2');
		expect(toggle).toHaveAttribute('title', 'Toggle title');
		expect(toggle).toHaveAttribute('tabindex', '2');
		expect(toggle).toHaveAttribute('aria-describedby', 'toggle-help');
		expect(toggle).toHaveAttribute('data-testid', 'integrated-toggle');
		toggle.focus();
		expect(toggle).toHaveFocus();
	});

	it('does not change state or invoke callbacks while disabled', async () => {
		const onchange = vi.fn();
		const onclick = vi.fn();
		render(Toggle, {
			props: { checked: true, disabled: true, ariaLabel: 'Disabled setting', onchange, onclick }
		});
		const toggle = screen.getByRole('switch', { name: 'Disabled setting' });

		expect(toggle).toBeDisabled();
		expect(toggle).toHaveClass('disabled:opacity-50');
		await fireEvent.click(toggle);
		await fireEvent.keyDown(toggle, { key: 'Enter' });
		await fireEvent.keyUp(toggle, { key: 'Enter' });

		expect(toggle).toHaveAttribute('aria-checked', 'true');
		expect(onchange).not.toHaveBeenCalled();
		expect(onclick).not.toHaveBeenCalled();
	});
});
