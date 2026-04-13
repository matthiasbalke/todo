import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, afterEach } from 'vitest';
import ItemForm from './ItemForm.svelte';

const defaultProps = {
	listId: 'list-1',
	categories: [],
	users: [],
	onsubmit: vi.fn(),
	oncancel: vi.fn(),
};

afterEach(() => {
	vi.clearAllMocks();
});

describe('ItemForm assignment chips', () => {
	it('should toggle chip to selected state on click and back to unselected on second click', async () => {
		const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
		const { container } = render(ItemForm, { props: { ...defaultProps, users: [user] } });

		const chip = container.querySelector('button[type="button"]')!;
		expect(chip.className).toContain('bg-gray-100'); // initially unselected

		await fireEvent.click(chip);
		expect(chip.className).toContain('bg-blue-100'); // selected after first click

		await fireEvent.click(chip);
		expect(chip.className).toContain('bg-gray-100'); // unselected after second click
	});

	it('should not suppress spacing between chip fieldset and surrounding elements', () => {
		const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
		const { container } = render(ItemForm, { props: { ...defaultProps, users: [user] } });
		const fieldset = container.querySelector('fieldset')!;
		// m-0 overrides space-y-3 gap; fieldset must not have that class
		expect(fieldset.className).not.toContain('m-0');
	});
});

describe('ItemForm focusout / cancel behaviour', () => {
	it('should not call oncancel when mousedown within form is followed by focusout with null relatedTarget', () => {
		const oncancel = vi.fn();
		const { container } = render(ItemForm, { props: { ...defaultProps, oncancel } });

		const form = container.querySelector('form')!;
		const titleInput = container.querySelector('input[placeholder="Item title"]')!;

		// Simulate user clicking on a non-focusable area within the form
		// (e.g. whitespace between fields, or the Add button in Safari which doesn't receive focus)
		fireEvent.mouseDown(form);

		// focusout fires with no relatedTarget — the relatedTarget=null case that currently triggers oncancel
		fireEvent.focusOut(titleInput, { relatedTarget: null });

		expect(oncancel).not.toHaveBeenCalled();
	});

	it('should call oncancel when focus moves to an element outside the form', () => {
		const oncancel = vi.fn();
		const { container } = render(ItemForm, { props: { ...defaultProps, oncancel } });

		const titleInput = container.querySelector('input[placeholder="Item title"]')!;
		const externalEl = document.createElement('button');
		document.body.appendChild(externalEl);

		fireEvent.focusOut(titleInput, { relatedTarget: externalEl });

		expect(oncancel).toHaveBeenCalledOnce();

		document.body.removeChild(externalEl);
	});

	it('should not call oncancel when focus moves between elements within the form', () => {
		const oncancel = vi.fn();
		const { container } = render(ItemForm, { props: { ...defaultProps, oncancel } });

		const titleInput = container.querySelector('input[placeholder="Item title"]')!;
		const notesTextarea = container.querySelector('textarea')!;

		fireEvent.focusOut(titleInput, { relatedTarget: notesTextarea });

		expect(oncancel).not.toHaveBeenCalled();
	});
});
