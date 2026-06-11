import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';

afterEach(cleanup);

describe('Select Component', () => {
const testOptions = ['Option 1', 'Option 2', 'Option 3'];

describe('Rendering and Initial State', () => {
it('renders with placeholder when no option is selected', () => {
render(Select, {
props: {
options: testOptions,
placeholder: 'Choose an option'
}
});

const button = screen.getByRole('button');
expect(button).toBeInTheDocument();
expect(button).toHaveTextContent('Choose an option');
});

it('renders with label when provided', () => {
render(Select, {
props: {
options: testOptions,
label: 'Test Label',
labelId: 'test-label'
}
});

const label = screen.getByText('Test Label');
expect(label).toBeInTheDocument();
});

it('renders with selected value when provided', () => {
render(Select, {
props: {
options: testOptions,
selected: 'Option 2'
}
});

const button = screen.getByRole('button');
expect(button).toHaveTextContent('Option 2');
});

it('renders primitive options without a label resolver', async () => {
render(Select, {
props: {
options: testOptions,
selected: 'Option 2'
}
});

expect(screen.getByRole('button')).toHaveTextContent('Option 2');
await fireEvent.click(screen.getByRole('button'));
expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(testOptions);
});

it('renders resolved labels while selecting the original option value', async () => {
const onSelect = vi.fn();
const options = ['category-1', 'category-2'];
render(Select, {
props: {
options,
selected: 'category-1',
getOptionLabel: (option: string) => option === 'category-1' ? 'Groceries' : 'Household',
onSelect
}
});

const trigger = screen.getByRole('button');
expect(trigger).toHaveTextContent('Groceries');

await fireEvent.click(trigger);
expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
await fireEvent.click(screen.getByRole('option', { name: 'Household' }));

expect(trigger).toHaveTextContent('Household');
expect(onSelect).toHaveBeenCalledWith('category-2');
});

it('is disabled when disabled prop is true', () => {
render(Select, {
props: {
options: testOptions,
disabled: true
}
});

const button = screen.getByRole('button');
expect(button).toBeDisabled();
});
});

describe('Opening and Closing Dropdown', () => {
it('opens dropdown on button click', async () => {
render(Select, {
props: {
options: testOptions
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

const listbox = screen.getByRole('listbox');
expect(listbox).toBeInTheDocument();
});

it('closes dropdown when open and button is clicked again', async () => {
render(Select, {
props: {
options: testOptions
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

let listbox = screen.queryByRole('listbox');
expect(listbox).toBeInTheDocument();

await fireEvent.click(button);

listbox = screen.queryByRole('listbox');
expect(listbox).not.toBeInTheDocument();
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

const button = screen.getByRole('button');
await fireEvent.click(button);

const options = screen.getAllByRole('option');
await fireEvent.click(options[0]);

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

const button = screen.getByRole('button');
await fireEvent.click(button);

const options = screen.getAllByRole('option');
await fireEvent.click(options[1]);

expect(selected).toBe(testOptions[1]);
});

it('closes dropdown after selecting an option', async () => {
render(Select, {
props: {
options: testOptions
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

const options = screen.getAllByRole('option');
await fireEvent.click(options[0]);

const listbox = screen.queryByRole('listbox');
expect(listbox).not.toBeInTheDocument();
});
});

describe('Disabled State', () => {
it('does not open dropdown when component is disabled', async () => {
render(Select, {
props: {
options: testOptions,
disabled: true
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

const listbox = screen.queryByRole('listbox');
expect(listbox).not.toBeInTheDocument();
});
});

describe('Accessibility Attributes', () => {
it('generates unique trigger and listbox IDs for multiple instances', async () => {
render(Select, { props: { options: testOptions, label: 'First' } });
render(Select, { props: { options: testOptions, label: 'Second' } });

const triggers = screen.getAllByRole('button');
expect(triggers[0].id).not.toBe(triggers[1].id);
await fireEvent.click(triggers[0]);
const firstListboxId = screen.getByRole('listbox').id;
await fireEvent.click(triggers[0]);
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

const button = screen.getByRole('button');
expect(button).toHaveAttribute('aria-haspopup', 'listbox');
expect(button).toHaveAttribute('aria-expanded', 'false');
});

it('updates aria-expanded when dropdown is opened', async () => {
render(Select, {
props: {
options: testOptions
}
});

const button = screen.getByRole('button');
expect(button).toHaveAttribute('aria-expanded', 'false');

await fireEvent.click(button);

expect(button).toHaveAttribute('aria-expanded', 'true');
});

it('sets aria-selected on options', async () => {
render(Select, {
props: {
options: testOptions,
selected: testOptions[0]
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

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

const button = screen.getByRole('button');
await fireEvent.click(button);

const listbox = screen.getByRole('listbox');
expect(listbox).toHaveAttribute('role', 'listbox');
});
});

describe('Empty Options', () => {
it('displays message when options array is empty', async () => {
render(Select, {
props: {
options: []
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

const noOptionsMsg = screen.getByText('No options available');
expect(noOptionsMsg).toBeInTheDocument();
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

const button = screen.getByRole('button');

await fireEvent.click(button);
let options = screen.getAllByRole('option');
await fireEvent.click(options[0]);

await fireEvent.click(button);
options = screen.getAllByRole('option');
await fireEvent.click(options[2]);

expect(onSelect).toHaveBeenCalledTimes(2);
expect(onSelect).toHaveBeenLastCalledWith(testOptions[2]);
});
});

describe('Mouse Hover Navigation', () => {
it('updates focus on mouse enter to options', async () => {
render(Select, {
props: {
options: testOptions
}
});

const button = screen.getByRole('button');
await fireEvent.click(button);

const options = screen.getAllByRole('option');
await fireEvent.mouseEnter(options[1]);

expect(options[1]).toBeInTheDocument();
});
});
});
