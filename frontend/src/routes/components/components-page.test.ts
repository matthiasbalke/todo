import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: true,
	version: 'test'
}));

import ComponentsPage from './+page.svelte';

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
			'variant',
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
		expect(showcase.getByText('Variants and click handling:')).toBeInTheDocument();
		expect(showcase.getByText('States, type, and class extension:')).toBeInTheDocument();
	});
});
