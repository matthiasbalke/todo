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

	it('documents the component controls, props, and change event', () => {
		render(ComponentsPage);

		const section = screen.getByRole('heading', { name: 'EditableLabel Component' }).closest('section');
		expect(section).not.toBeNull();

		const showcase = within(section!);
		expect(showcase.getByText('Click, Enter, Space')).toBeInTheDocument();
		expect(showcase.getByText('Escape')).toBeInTheDocument();
		expect(showcase.getByText('Blur')).toBeInTheDocument();

		for (const prop of [
			'value',
			'label',
			'placeholder',
			'type',
			'disabled',
			'required',
			'validate',
			'isSaving',
			'ariaLabel'
		]) {
			expect(showcase.getByText(prop, { selector: 'td' })).toBeInTheDocument();
		}

		expect(showcase.getByText('change', { selector: 'td' })).toBeInTheDocument();
		expect(showcase.getByText('{ value: string }')).toBeInTheDocument();
	});
});
