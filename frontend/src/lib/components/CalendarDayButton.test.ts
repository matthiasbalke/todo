import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CalendarDayButton from './CalendarDayButton.svelte';
import CalendarDayButtonBinding from './test/CalendarDayButtonBinding.svelte';

describe('CalendarDayButton', () => {
	it('exposes grid, date, selection, current-date, and roving-focus semantics', () => {
		const { container } = render(CalendarDayButton, {
			props: {
				value: '2026-06-09',
				day: 9,
				label: 'Tuesday, June 9, 2026',
				selected: true,
				current: true,
				focused: true
			}
		});

		const day = screen.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' });
		expect(day).toHaveAttribute('data-date', '2026-06-09');
		expect(day).toHaveAttribute('aria-selected', 'true');
		expect(day).toHaveAttribute('aria-current', 'date');
		expect(day).toHaveAttribute('tabindex', '0');
		expect(day).toHaveClass('bg-blue-600', 'focus:ring-2');
		expect(container.querySelector('button')).toBe(day);
	});

	it('forwards native events and binds the native element', async () => {
		const onclick = vi.fn();
		const onkeydown = vi.fn();
		render(CalendarDayButton, {
			props: {
				value: '2026-06-10',
				day: 10,
				label: 'Wednesday, June 10, 2026',
				onclick,
				onkeydown
			}
		});
		const day = screen.getByRole('gridcell');

		await fireEvent.click(day);
		await fireEvent.keyDown(day, { key: 'ArrowRight' });

		expect(onclick).toHaveBeenCalledOnce();
		expect(onkeydown).toHaveBeenCalledOnce();

		const onbound = vi.fn();
		render(CalendarDayButtonBinding, { props: { onbound } });
		expect(onbound).toHaveBeenCalledWith(screen.getAllByRole('gridcell')[1]);
	});

	it('owns adjacent and disabled presentation and blocks activation', async () => {
		const onclick = vi.fn();
		render(CalendarDayButton, {
			props: {
				value: '2026-07-01',
				day: 1,
				label: 'Wednesday, July 1, 2026',
				adjacent: true,
				disabled: true,
				onclick
			}
		});
		const day = screen.getByRole('gridcell');

		expect(day).toBeDisabled();
		expect(day).toHaveClass('text-gray-400', 'disabled:opacity-30');
		await fireEvent.click(day);
		expect(onclick).not.toHaveBeenCalled();
	});
});
