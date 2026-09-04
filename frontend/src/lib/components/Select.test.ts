import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';
import SelectSnippetFixture from './test/SelectSnippetFixture.svelte';
import SelectTransformedFixture from './test/SelectTransformedFixture.svelte';

afterEach(cleanup);

describe('Select Component', () => {
	const testOptions = ['Option 1', 'Option 2', 'Option 3'];

	function combobox(name = 'Select an option') {
		return screen.getByRole('combobox', { name });
	}

	describe('Rendering and Initial State', () => {
		it('renders with placeholder when no option is selected', () => {
			render(Select, {
				props: {
					options: testOptions,
					placeholder: 'Choose an option'
				}
			});

			const trigger = combobox('Choose an option');
			expect(trigger).toBeInTheDocument();
			expect(trigger).toHaveValue('');
			expect(trigger).toHaveAttribute('placeholder', 'Choose an option');
		});

		it('renders with label when provided', () => {
			render(Select, {
				props: {
					options: testOptions,
					label: 'Test Label',
					labelId: 'test-label'
				}
			});

			expect(screen.getByText('Test Label')).toBeInTheDocument();
			expect(screen.getByRole('combobox', { name: 'Test Label' })).toBeInTheDocument();
		});

		it('renders with selected value when provided', () => {
			render(Select, {
				props: {
					options: testOptions,
					selected: 'Option 2'
				}
			});

			expect(combobox()).toHaveValue('Option 2');
		});

		it('renders primitive options without a label resolver', async () => {
			render(Select, {
				props: {
					options: testOptions,
					selected: 'Option 2'
				}
			});

			const trigger = combobox();
			expect(trigger).toHaveValue('Option 2');
			await fireEvent.click(trigger);
			expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(
				testOptions
			);
		});

		it('renders resolved labels while selecting the original option value', async () => {
			const onSelect = vi.fn();
			const options = ['category-1', 'category-2'];
			render(Select, {
				props: {
					options,
					selected: 'category-1',
					getOptionLabel: (option: string) => (option === 'category-1' ? 'Groceries' : 'Household'),
					onSelect
				}
			});

			const trigger = combobox();
			expect(trigger).toHaveValue('Groceries');

			await fireEvent.click(trigger);
			expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
			await fireEvent.click(screen.getByRole('option', { name: 'Household' }));

			expect(trigger).toHaveValue('Household');
			expect(onSelect).toHaveBeenCalledWith('category-2');
		});

		it('renders optional snippet content while preserving label values', async () => {
			render(SelectSnippetFixture);

			const trigger = screen.getByRole('combobox', { name: 'Snippet select' });
			expect(trigger).toHaveValue('Groceries');
			expect(screen.getByTestId('selected-prefix')).toHaveTextContent('category-1');

			await fireEvent.click(trigger);
			expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
			expect(screen.getByTestId('option-content-category-2')).toHaveTextContent('Household');

			await fireEvent.input(trigger, { target: { value: 'house' } });
			expect(screen.queryByTestId('selected-prefix')).not.toBeInTheDocument();
			await fireEvent.keyDown(trigger, { key: 'Enter' });

			expect(trigger).toHaveValue('Household');
			expect(screen.getByTestId('selected-prefix')).toHaveTextContent('category-2');
		});

		it('is disabled when disabled prop is true', () => {
			render(Select, {
				props: {
					options: testOptions,
					disabled: true
				}
			});

			expect(combobox()).toBeDisabled();
		});
	});

	describe('Opening and Closing Dropdown', () => {
		it('opens dropdown on combobox click', async () => {
			render(Select, {
				props: {
					options: testOptions
				}
			});

			await fireEvent.click(combobox());

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('closes on outside click and restores trigger focus on Escape', async () => {
			render(Select, { props: { options: testOptions, label: 'Dismissible select' } });
			const trigger = screen.getByRole('combobox', { name: 'Dismissible select' });

			await fireEvent.click(trigger);
			await fireEvent.click(document.body);
			await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

			await fireEvent.click(trigger);
			trigger.focus();
			await fireEvent.keyDown(trigger, { key: 'Escape' });
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(trigger).toHaveFocus();
		});
	});

	describe('Dropdown Positioning', () => {
		it('anchors the listbox to a trigger-local wrapper inside a transformed ancestor', async () => {
			render(SelectTransformedFixture);

			const trigger = screen.getByRole('combobox', { name: 'Transformed select' });
			await fireEvent.click(trigger);
			const listbox = screen.getByRole('listbox', { name: 'Transformed select' });
			const wrapper = trigger.parentElement?.parentElement;

			expect(wrapper).toHaveClass('relative');
			expect(listbox.parentElement).toBe(wrapper);
			expect(listbox).toHaveClass('absolute', 'left-0', 'top-full', 'w-full');
			expect(listbox).not.toHaveClass('fixed');
			expect(listbox).not.toHaveAttribute('style');
		});

		it('uses the same trigger-relative placement in a normal form', async () => {
			render(Select, { props: { options: testOptions, label: 'Normal select' } });

			const trigger = screen.getByRole('combobox', { name: 'Normal select' });
			await fireEvent.click(trigger);
			const listbox = screen.getByRole('listbox', { name: 'Normal select' });

			expect(listbox.parentElement).toBe(trigger.parentElement?.parentElement);
			expect(listbox).toHaveClass('top-full', 'w-full');
		});
	});

	describe('Option Selection', () => {
		it('calls onSelect callback when option is clicked', async () => {
			const onSelect = vi.fn();
			render(Select, {
				props: {
					options: testOptions,
					onSelect
				}
			});

			await fireEvent.click(combobox());
			await fireEvent.click(screen.getAllByRole('option')[0]);

			expect(onSelect).toHaveBeenCalledWith(testOptions[0]);
		});

		it('updates selected value when option is clicked', async () => {
			let selected: string | null = null;
			render(Select, {
				props: {
					options: testOptions,
					selected,
					onSelect: (value) => {
						selected = value;
					}
				}
			});

			await fireEvent.click(combobox());
			await fireEvent.click(screen.getAllByRole('option')[1]);

			expect(selected).toBe(testOptions[1]);
			expect(combobox()).toHaveValue(testOptions[1]);
		});

		it('closes dropdown after selecting an option', async () => {
			render(Select, {
				props: {
					options: testOptions
				}
			});

			await fireEvent.click(combobox());
			await fireEvent.click(screen.getAllByRole('option')[0]);

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	describe('Search Behavior', () => {
		it('filters predefined options by typed display label', async () => {
			render(Select, {
				props: {
					options: testOptions
				}
			});

			const trigger = combobox();
			await fireEvent.input(trigger, { target: { value: '2' } });

			expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
				'Option 2'
			]);
		});

		it('filters resolved labels while selecting the original value', async () => {
			const onSelect = vi.fn();
			const options = ['category-1', 'category-2'];
			render(Select, {
				props: {
					options,
					getOptionLabel: (option: string) => (option === 'category-1' ? 'Groceries' : 'Household'),
					onSelect
				}
			});

			const trigger = combobox();
			await fireEvent.input(trigger, { target: { value: 'house' } });
			await fireEvent.keyDown(trigger, { key: 'Enter' });

			expect(onSelect).toHaveBeenCalledWith('category-2');
			expect(trigger).toHaveValue('Household');
		});

		it('abandons typed search without changing the selected value', async () => {
			const onSelect = vi.fn();
			render(Select, {
				props: {
					options: testOptions,
					selected: 'Option 1',
					onSelect
				}
			});

			const trigger = combobox();
			await fireEvent.input(trigger, { target: { value: '3' } });
			expect(trigger).toHaveValue('3');

			await fireEvent.keyDown(trigger, { key: 'Escape' });

			expect(trigger).toHaveValue('Option 1');
			expect(onSelect).not.toHaveBeenCalled();
		});

		it('shows no-match state and does not select on Enter', async () => {
			const onSelect = vi.fn();
			render(Select, {
				props: {
					options: testOptions,
					selected: 'Option 1',
					onSelect
				}
			});

			const trigger = combobox();
			await fireEvent.input(trigger, { target: { value: 'missing' } });
			expect(screen.getByText('No matching options')).toBeInTheDocument();

			await fireEvent.keyDown(trigger, { key: 'Enter' });

			expect(onSelect).not.toHaveBeenCalled();
			expect(trigger).toHaveValue('missing');
		});
	});

	describe('Disabled State', () => {
		it('does not open, filter, or emit changes when component is disabled', async () => {
			const onSelect = vi.fn();
			render(Select, {
				props: {
					options: testOptions,
					selected: 'Option 1',
					disabled: true,
					onSelect
				}
			});

			const trigger = combobox();
			await fireEvent.click(trigger);
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(trigger).toHaveValue('Option 1');
			expect(onSelect).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility Attributes', () => {
		it('generates unique trigger and listbox IDs for multiple instances', async () => {
			render(Select, { props: { options: testOptions, label: 'First' } });
			render(Select, { props: { options: testOptions, label: 'Second' } });

			const triggers = screen.getAllByRole('combobox');
			expect(triggers[0].id).not.toBe(triggers[1].id);
			await fireEvent.click(triggers[0]);
			const firstListboxId = screen.getByRole('listbox').id;
			await fireEvent.keyDown(triggers[0], { key: 'Escape' });
			await fireEvent.click(triggers[1]);
			expect(screen.getByRole('listbox').id).not.toBe(firstListboxId);
		});

		it('has correct aria attributes when closed', () => {
			render(Select, {
				props: {
					options: testOptions,
					label: 'Test Select'
				}
			});

			const trigger = screen.getByRole('combobox', { name: 'Test Select' });
			expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(trigger).not.toHaveAttribute('aria-controls');
			expect(trigger).not.toHaveAttribute('aria-activedescendant');
		});

		it('updates aria-expanded, aria-controls, and aria-activedescendant when dropdown is opened', async () => {
			render(Select, {
				props: {
					options: testOptions,
					label: 'Test Select'
				}
			});

			const trigger = screen.getByRole('combobox', { name: 'Test Select' });
			await fireEvent.click(trigger);
			const listbox = screen.getByRole('listbox', { name: 'Test Select' });

			expect(trigger).toHaveAttribute('aria-expanded', 'true');
			expect(trigger).toHaveAttribute('aria-controls', listbox.id);
			expect(trigger).toHaveAttribute('aria-activedescendant', `${listbox.id}-option-0`);
		});

		it('sets aria-selected on options', async () => {
			render(Select, {
				props: {
					options: testOptions,
					selected: testOptions[0]
				}
			});

			await fireEvent.click(combobox());

			const options = screen.getAllByRole('option');
			expect(options[0]).toHaveAttribute('aria-selected', 'true');
			expect(options[1]).toHaveAttribute('aria-selected', 'false');
			expect(options[2]).toHaveAttribute('aria-selected', 'false');
		});

		it('has listbox role on dropdown', async () => {
			render(Select, {
				props: {
					options: testOptions
				}
			});

			await fireEvent.click(combobox());

			expect(screen.getByRole('listbox')).toHaveAttribute('role', 'listbox');
		});
	});

	describe('Empty Options', () => {
		it('displays message when options array is empty', async () => {
			render(Select, {
				props: {
					options: []
				}
			});

			await fireEvent.click(combobox());

			expect(screen.getByText('No options available')).toBeInTheDocument();
		});
	});

	describe('Multiple Selection Attempts', () => {
		it('can select different options sequentially', async () => {
			const onSelect = vi.fn();
			render(Select, {
				props: {
					options: testOptions,
					onSelect
				}
			});

			const trigger = combobox();

			await fireEvent.click(trigger);
			await fireEvent.click(screen.getAllByRole('option')[0]);

			await fireEvent.click(trigger);
			await fireEvent.click(screen.getAllByRole('option')[2]);

			expect(onSelect).toHaveBeenCalledTimes(2);
			expect(onSelect).toHaveBeenLastCalledWith(testOptions[2]);
		});
	});

	describe('Mouse Hover Navigation', () => {
		it('updates active descendant on mouse enter to options', async () => {
			render(Select, {
				props: {
					options: testOptions
				}
			});

			const trigger = combobox();
			await fireEvent.click(trigger);

			const options = screen.getAllByRole('option');
			await fireEvent.mouseEnter(options[1]);

			expect(trigger).toHaveAttribute(
				'aria-activedescendant',
				`${screen.getByRole('listbox').id}-option-1`
			);
		});
	});
});
