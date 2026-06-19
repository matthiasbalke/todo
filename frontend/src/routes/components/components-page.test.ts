import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: true,
	version: 'test'
}));

import ComponentsPage from './+page.svelte';

describe('ComponentsPage Textarea showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('updates bound multiline value feedback', async () => {
		render(ComponentsPage);
		const section = screen.getByRole('heading', { name: 'Textarea Component' }).closest('section')!;
		const showcase = within(section);
		const textarea = showcase.getByRole('textbox', { name: 'Project notes' });

		await fireEvent.input(textarea, { target: { value: 'First line\nSecond line' } });

		expect(showcase.getByText('Bound value:').parentElement).toHaveTextContent(
			'First line Second line'
		);
	});

	it('demonstrates validation, required, disabled, rows, and resize states', async () => {
		render(ComponentsPage);
		const section = screen.getByRole('heading', { name: 'Textarea Component' }).closest('section')!;
		const showcase = within(section);
		const validated = showcase.getByRole('textbox', { name: 'Short summary' });

		await fireEvent.input(validated, { target: { value: 'short' } });

		expect(showcase.getByText('Use at least 10 characters')).toBeInTheDocument();
		expect(validated).toHaveAttribute('aria-invalid', 'true');
		expect(showcase.getByRole('textbox', { name: 'Required context' })).toBeRequired();
		expect(showcase.getByRole('textbox', { name: 'Locked notes' })).toBeDisabled();
		expect(showcase.getByRole('textbox', { name: 'Six-row notes' })).toHaveAttribute('rows', '6');
		expect(showcase.getByRole('textbox', { name: 'Horizontal resize notes' })).toHaveClass(
			'resize-x'
		);
	});

	it('documents Textarea usage, props, and native forwarding', () => {
		render(ComponentsPage);
		const section = screen.getByRole('heading', { name: 'Textarea Component' }).closest('section');
		expect(section).not.toBeNull();
		const showcase = within(section!);

		for (const prop of [
			'value',
			'label',
			'description',
			'placeholder',
			'required',
			'disabled',
			'rows',
			'resize',
			'validate',
			'ariaLabel',
			'class'
		]) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}

		expect(showcase.getByText('Binding and native attributes:')).toBeInTheDocument();
		expect(showcase.getByText('Validation and resize behavior:')).toBeInTheDocument();
		expect(
			showcase.getByText(/standard native textarea attributes and handlers/i)
		).toBeInTheDocument();
	});
});

describe('ComponentsPage EditableLabel showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('shows the latest value emitted by the basic example', async () => {
		render(ComponentsPage);

		await fireEvent.click(screen.getByRole('button', { name: 'Edit basic display name' }));
		const input = screen.getByRole('textbox', { name: 'Edit basic display name' });
		await fireEvent.input(input, { target: { value: 'Jordan Lee' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(screen.getByText('Latest emitted value:').parentElement).toHaveTextContent('Jordan Lee');
	});

	it('demonstrates validation and unavailable states', async () => {
		render(ComponentsPage);

		await fireEvent.click(screen.getByRole('button', { name: 'Edit validated display name' }));
		const input = screen.getByRole('textbox', { name: 'Edit validated display name' });
		await fireEvent.input(input, { target: { value: 'Al' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(screen.getByText('Display name must be at least 3 characters')).toBeInTheDocument();
		expect(input).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Disabled display name' })).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect(screen.getByRole('button', { name: 'Saving display name' })).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	});

	it('requires the Save button to commit the explicit example', async () => {
		render(ComponentsPage);

		await fireEvent.click(screen.getByRole('button', { name: 'Edit explicit display name' }));
		const input = screen.getByRole('textbox', { name: 'Edit explicit display name' });
		await fireEvent.input(input, { target: { value: 'Casey Stone' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(screen.getByText('Latest explicitly saved value:').parentElement).toHaveTextContent(
			'Morgan Reed'
		);
		expect(input).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

		expect(screen.getByText('Latest explicitly saved value:').parentElement).toHaveTextContent(
			'Casey Stone'
		);
	});

	it('documents the component controls, props, and change event', () => {
		render(ComponentsPage);

		const section = screen.getByRole('heading', { name: 'EditableLabel Component' }).closest('section');
		expect(section).not.toBeNull();

		const showcase = within(section!);
		expect(showcase.getByText('Click, Enter, Space')).toBeInTheDocument();
		expect(showcase.getByText('Escape')).toBeInTheDocument();
		expect(showcase.getByText('Automatic: Enter')).toBeInTheDocument();
		expect(showcase.getByText('Automatic: Blur')).toBeInTheDocument();
		expect(showcase.getByText('Explicit: Save button')).toBeInTheDocument();
		expect(showcase.getByText('Explicit: Enter')).toBeInTheDocument();
		expect(showcase.getByText('Explicit: Blur')).toBeInTheDocument();

		for (const prop of [
			'value',
			'label',
			'placeholder',
			'type',
			'disabled',
			'required',
			'validate',
			'isSaving',
			'ariaLabel',
			'saveMode'
		]) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}

		expect(showcase.getByText('change', { selector: 'td' })).toBeInTheDocument();
		expect(showcase.getByText('{ value: string }')).toBeInTheDocument();
	});
});

describe('ComponentsPage Button showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders variants and updates local click feedback', async () => {
		render(ComponentsPage);

		expect(screen.getByRole('button', { name: 'Primary action' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Secondary action' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Danger action' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Danger action' }));
		expect(screen.getByText('Last action:').parentElement).toHaveTextContent('Danger');
	});

	it('demonstrates disabled, loading, custom-class, and submit behavior', async () => {
		render(ComponentsPage);

		expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
		const loadingButton = screen.getByRole('button', { name: 'Saving…' });
		expect(loadingButton).toBeDisabled();
		expect(loadingButton).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('button', { name: 'Full-width button' })).toHaveClass('w-full');

		await fireEvent.click(screen.getByRole('button', { name: 'Submit example' }));
		expect(screen.getByText('Last action:').parentElement).toHaveTextContent('Submit');
	});

	it('documents Button props and native forwarding', () => {
		render(ComponentsPage);

		const section = screen.getByRole('heading', { name: 'Button Component' }).closest('section');
		expect(section).not.toBeNull();
		const showcase = within(section!);

		for (const prop of [
			'tone',
			'appearance',
			'selected',
			'weight',
			'type',
			'disabled',
			'loading',
			'loadingLabel',
			'class',
			'children'
		]) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}

		expect(showcase.getByText(/standard native button attributes and handlers/i)).toBeInTheDocument();
		expect(showcase.getByText('Tone, appearance, and click handling:')).toBeInTheDocument();
		expect(showcase.getByText('States, type, and layout classes:')).toBeInTheDocument();
		expect(showcase.getByText(/selected options use blue text/i)).toBeInTheDocument();
	});
});

describe('ComponentsPage Toggle showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('demonstrates states, binding, accessible labels, callbacks, and API guidance', async () => {
		render(ComponentsPage);
		const section = screen.getByRole('heading', { name: 'Toggle Component' }).closest('section')!;
		const showcase = within(section);

		expect(showcase.getByRole('switch', { name: 'Off example' })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect(showcase.getByRole('switch', { name: 'On example' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(showcase.getByRole('switch', { name: 'Disabled example' })).toBeDisabled();

		await fireEvent.click(showcase.getByRole('switch', { name: 'Bound example' }));
		expect(showcase.getByText(/Bound value:/)).toHaveTextContent(
			'Bound value: true; callback: true'
		);

		for (const prop of ['checked', 'disabled', 'ariaLabel', 'onchange', 'id', 'class', 'element']) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}
		expect(section).toHaveTextContent(
			'Provide an accessible name with ariaLabel or aria-labelledby.'
		);
		expect(showcase.getByText(/standard native button attributes and handlers/i)).toBeInTheDocument();
	});
});

describe('ComponentsPage DatePicker showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders empty, selected, constrained, and disabled examples', () => {
		render(ComponentsPage);

		expect(screen.getByRole('button', { name: 'Optional due date' })).toHaveTextContent('No due date');
		expect(screen.getByRole('button', { name: 'Release date' })).toHaveTextContent('Jun 9, 2026');
		expect(screen.getByRole('button', { name: 'Appointment date' })).toHaveTextContent(
			'Jun 15, 2026'
		);
		expect(screen.getByRole('button', { name: 'Locked date' })).toBeDisabled();
	});

	it('updates the displayed ISO value when selecting and clearing', async () => {
		render(ComponentsPage);

		const example = screen.getByRole('heading', { name: 'Preselected Value' }).parentElement!;
		const trigger = within(example).getByRole('button', { name: 'Release date' });
		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('gridcell', { name: 'Monday, June 15, 2026' }));

		expect(example).toHaveTextContent('2026-06-15');

		await fireEvent.click(trigger);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
		expect(example).toHaveTextContent('null');
	});

	it('documents keyboard controls and the complete DatePicker API', () => {
		render(ComponentsPage);

		const section = screen.getByRole('heading', { name: 'DatePicker Component' }).closest('section');
		expect(section).not.toBeNull();
		const showcase = within(section!);

		for (const prop of [
			'value',
			'label',
			'placeholder',
			'required',
			'disabled',
			'min',
			'max',
			'locale',
			'ariaLabel'
		]) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}

		expect(showcase.getByText('Home, End')).toBeInTheDocument();
		expect(showcase.getByText('Page Up, Page Down')).toBeInTheDocument();
		expect(showcase.getByText('Enter, Space')).toBeInTheDocument();
		expect(showcase.getByText('Nullable ISO date:')).toBeInTheDocument();
		expect(showcase.getByText('Localized constrained date:')).toBeInTheDocument();
	});
});

describe('ComponentsPage specialized controls showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('demonstrates domain state without consumer visual styling', async () => {
		render(ComponentsPage);
		const section = screen
			.getByRole('heading', { name: 'Specialized Interaction Controls' })
			.closest('section')!;
		const showcase = within(section);

		expect(showcase.getByRole('gridcell', { name: 'Tuesday, June 9, 2026' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(showcase.getByRole('button', { name: 'Selected blue category' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await fireEvent.click(showcase.getByRole('button', { name: 'Mark done' }));
		await fireEvent.click(showcase.getByRole('button', { name: 'Star' }));
		expect(showcase.getByRole('button', { name: 'Mark undone' })).toBeInTheDocument();
		expect(showcase.getByRole('button', { name: 'Unstar' })).toBeInTheDocument();
		expect(showcase.getByRole('button', { name: 'Delete example item' })).toHaveClass('bg-red-600');
	});
});

describe('ComponentsPage Select showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('demonstrates searchable predefined selection', async () => {
		render(ComponentsPage);
		const section = screen.getByRole('heading', { name: 'Select Component' }).closest('section')!;
		const showcase = within(section);
		const trigger = showcase.getByRole('combobox', { name: 'Choose a Fruit' });

		await fireEvent.input(trigger, { target: { value: 'ban' } });

		expect(showcase.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
			'Banana'
		]);

		await fireEvent.keyDown(trigger, { key: 'Enter' });

		expect(trigger).toHaveValue('Banana');
		expect(showcase.getAllByText('Selected:')[0].parentElement).toHaveTextContent('Banana');
	});
});

describe('ComponentsPage TimezonePicker showcase', () => {
	afterEach(() => {
		cleanup();
	});

	it('demonstrates IANA binding, disabled state, usage, and API guidance', async () => {
		render(ComponentsPage);
		const section = screen
			.getByRole('heading', { name: 'TimezonePicker Component' })
			.closest('section')!;
		const showcase = within(section);

		expect(showcase.getByRole('combobox', { name: 'Account timezone' })).toHaveValue(
			'Berlin (Europe)'
		);
		expect(showcase.getByRole('combobox', { name: 'Locked timezone' })).toBeDisabled();
		expect(showcase.getByText('Selected identifier:').parentElement).toHaveTextContent(
			'Europe/Berlin'
		);
		expect(showcase.getByText('Bindable IANA identifier:')).toBeInTheDocument();

		for (const prop of ['selected', 'label', 'placeholder', 'disabled', 'onSelect']) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}
	});
});
