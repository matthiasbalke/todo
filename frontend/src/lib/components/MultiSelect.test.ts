import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MultiSelect from './MultiSelect.svelte';
import MultiSelectSnippetFixture from './test/MultiSelectSnippetFixture.svelte';

afterEach(cleanup);

describe('MultiSelect', () => {
	const options = ['Apple', 'Banana', 'Cherry'];

	it('renders an accessible empty trigger and opens available options', async () => {
		render(MultiSelect, {
			props: {
				options,
				label: 'Fruit',
				placeholder: 'Choose fruit'
			}
		});

		const trigger = screen.getByRole('combobox', { name: 'Fruit' });
		expect(trigger).toHaveAttribute('placeholder', 'Choose fruit');

		await fireEvent.click(trigger);

		const listbox = screen.getByRole('listbox', { name: 'Fruit' });
		expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
		expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
			'Apple',
			'Banana',
			'Cherry'
		]);
	});

	it('selects multiple options, keeps the list open, and emits complete arrays', async () => {
		const onChange = vi.fn();
		render(MultiSelect, { props: { options, label: 'Fruit', onChange } });

		await fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

		expect(screen.getByRole('listbox')).toBeInTheDocument();
		expect(onChange).toHaveBeenLastCalledWith(['Apple']);
		const appleOption = screen.getByRole('option', { name: 'Apple' });
		expect(appleOption).toHaveAttribute('aria-selected', 'true');
		expect(appleOption).not.toHaveTextContent('selected');
		expect(appleOption.querySelector('.lucide-check')).toBeInTheDocument();
		expect(screen.getAllByText('Apple').length).toBeGreaterThan(1);

		await fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
		expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Banana']);
		expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(screen.getAllByText('Apple').length).toBeGreaterThan(1);
		expect(screen.getAllByText('Banana').length).toBeGreaterThan(1);
	});

	it('removes an already-selected option without clearing remaining values', async () => {
		const onChange = vi.fn();
		render(MultiSelect, {
			props: {
				options,
				selected: ['Apple', 'Banana'],
				label: 'Fruit',
				onChange
			}
		});

		await fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

		expect(onChange).toHaveBeenLastCalledWith(['Banana']);
		expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
	});

	it('filters options and closes on Escape without changing selected values', async () => {
		const onChange = vi.fn();
		render(MultiSelect, {
			props: {
				options,
				selected: ['Apple'],
				label: 'Fruit',
				onChange
			}
		});

		const trigger = screen.getByRole('combobox', { name: 'Fruit' });
		await fireEvent.input(trigger, { target: { value: 'cher' } });
		expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument();
		expect(screen.queryByRole('option', { name: /Apple/ })).not.toBeInTheDocument();

		await fireEvent.keyDown(trigger, { key: 'Escape' });

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
		expect(onChange).not.toHaveBeenCalled();
	});

	it('closes on outside focus or click without changing selected values', async () => {
		const onChange = vi.fn();
		render(MultiSelect, { props: { options, selected: ['Apple'], label: 'Fruit', onChange } });

		await fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
		expect(screen.getByRole('listbox')).toBeInTheDocument();

		await fireEvent.click(document.body);
		await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
		expect(onChange).not.toHaveBeenCalled();
	});

	it('supports custom option and selected rendering with accessible labels', async () => {
		render(MultiSelectSnippetFixture);

		const trigger = screen.getByRole('combobox', { name: 'Assignees' });
		await fireEvent.click(trigger);
		expect(screen.getByRole('option', { name: 'Casey Stone' })).toBeInTheDocument();
		expect(screen.getByTestId('option-casey')).toHaveTextContent('Casey Stone');

		await fireEvent.click(screen.getByRole('option', { name: 'Casey Stone' }));
		const selectedCaseyOption = screen.getByRole('option', { name: 'Casey Stone' });
		expect(selectedCaseyOption).toHaveAttribute('aria-selected', 'true');
		expect(selectedCaseyOption.querySelector('.lucide-check')).toBeInTheDocument();
		expect(selectedCaseyOption).not.toHaveTextContent('selected');
		expect(screen.getByTestId('selected-casey')).toHaveTextContent('Casey Stone');

		await fireEvent.click(screen.getByRole('option', { name: 'Riley Chen' }));
		expect(screen.getByTestId('selected-casey')).toHaveTextContent('Casey Stone');
		expect(screen.getByTestId('selected-riley')).toHaveTextContent('Riley Chen');

		await fireEvent.keyDown(trigger, { key: 'Escape' });
		expect(screen.getByTestId('selected-casey')).toHaveTextContent('Casey Stone');
		expect(screen.getByTestId('selected-riley')).toHaveTextContent('Riley Chen');
		expect(screen.getByText('Selected count: 2')).toBeInTheDocument();
		expect(screen.getByText('Latest ids: casey,riley')).toBeInTheDocument();
	});
});
