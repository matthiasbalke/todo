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
