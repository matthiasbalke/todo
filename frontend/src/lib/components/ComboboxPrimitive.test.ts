import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ComboboxPrimitiveFixture from './test/ComboboxPrimitiveFixture.svelte';

afterEach(cleanup);

describe('ComboboxPrimitive', () => {
	it('opens a trigger-local listbox and filters through wrapper-owned input state', async () => {
		render(ComboboxPrimitiveFixture);

		const trigger = screen.getByRole('combobox', { name: 'Primitive fruit' });
		expect(trigger).toHaveClass('font-sans', 'text-sm', 'leading-5', 'font-normal');
		await fireEvent.input(trigger, { target: { value: 'ban' } });

		const listbox = screen.getByRole('listbox', { name: 'Primitive fruit' });
		expect(listbox.parentElement).toBe(trigger.parentElement?.parentElement);
		expect(listbox).toHaveClass('absolute', 'left-0', 'top-full', 'w-full');
		expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
			'Banana'
		]);
	});

	it('supports keyboard navigation and selection', async () => {
		render(ComboboxPrimitiveFixture);

		const trigger = screen.getByRole('combobox', { name: 'Primitive fruit' });
		await fireEvent.click(trigger);
		await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		await fireEvent.keyDown(trigger, { key: 'Enter' });

		expect(trigger).toHaveValue('Banana');
		expect(screen.getByText('Selected: Banana')).toBeInTheDocument();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('keeps option activation available when pointer down occurs before click', async () => {
		render(ComboboxPrimitiveFixture);

		const trigger = screen.getByRole('combobox', { name: 'Primitive fruit' });
		await fireEvent.input(trigger, { target: { value: 'cher' } });
		const option = screen.getByRole('option', { name: 'Cherry' });
		const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
		const preventDefault = vi.spyOn(pointerDown, 'preventDefault');
		option.dispatchEvent(pointerDown);
		await fireEvent.click(option);

		expect(preventDefault).toHaveBeenCalledOnce();
		expect(trigger).toHaveValue('Cherry');
		expect(screen.getByText('Selected: Cherry')).toBeInTheDocument();
	});

	it('closes on outside click', async () => {
		render(ComboboxPrimitiveFixture);

		await fireEvent.click(screen.getByRole('combobox', { name: 'Primitive fruit' }));
		expect(screen.getByRole('listbox')).toBeInTheDocument();

		await fireEvent.click(document.body);

		await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
	});
});
