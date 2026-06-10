<script lang="ts">
	import { dev } from '$app/environment';
	import TextInput from '$lib/components/TextInput.svelte';
	import EmailInput from '$lib/components/EmailInput.svelte';
	import Select from '$lib/components/Select.svelte';
	import EditableLabel from '$lib/components/EditableLabel.svelte';
	import Button from '$lib/components/Button.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	let lastButtonAction = 'None';
	let emptyDate: string | null = null;
	let selectedDate: string | null = '2026-06-09';
	let constrainedDate: string | null = '2026-06-15';
	let textareaValue = 'Plan the first milestone.';
	let validatedTextareaValue = '';
	let requiredTextareaValue = '';
	let email = '';
	let password = '';
	let username = '';
	let searchQuery = '';
	let editableName = 'Alex Morgan';
	let latestEditableName = editableName;
	let explicitEditableName = 'Morgan Reed';
	let latestExplicitEditableName = explicitEditableName;
	let validatedEditableName = 'Taylor';
	let disabledEditableName = 'Editing disabled';
	let savingEditableName = 'Saving in progress';

	let selectedFruit: string | null = null;
	let selectedPriority: string | null = null;
	let selectedCategory: string | null = null;

	const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig'];
	const priorities = ['Low', 'Medium', 'High', 'Urgent'];
	const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance'];

	function handleButtonAction(action: string) {
		lastButtonAction = action;
	}

	function handleButtonSubmit(event: SubmitEvent) {
		event.preventDefault();
		lastButtonAction = 'Submit';
	}

	function validateEmail(value: string): string | null {
		if (!value) return 'Email is required';
		if (!value.includes('@')) return 'Email must include @';
		if (!value.includes('.')) return 'Email must include a domain';
		return null;
	}

	function validatePassword(value: string): string | null {
		if (!value) return 'Password is required';
		if (value.length < 8) return 'Password must be at least 8 characters';
		return null;
	}

	function validateUsername(value: string): string | null {
		if (!value) return 'Username is required';
		if (value.length < 3) return 'Username must be at least 3 characters';
		if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, - and _';
		return null;
	}

	function validateTextarea(value: string): string | null {
		if (value.trim().length < 10) return 'Use at least 10 characters';
		return null;
	}

	function validateEditableName(value: string): string | null {
		if (!value.trim()) return 'Display name is required';
		if (value.trim().length < 3) return 'Display name must be at least 3 characters';
		return null;
	}

	function handleEditableNameChange(event: CustomEvent<{ value: string }>) {
		latestEditableName = event.detail.value;
	}

	function handleExplicitEditableNameChange(event: CustomEvent<{ value: string }>) {
		latestExplicitEditableName = event.detail.value;
	}

	function validateSelection(value: string | null): string | null {
		if (value === 'High' || value === 'Urgent' ) return null;
		return 'select a high or urgent value';
	}

	const basicInputCode = `<TextInput
  bind:value={myValue}
  label="Name"
  placeholder="Enter your name"
/>`;

	const validatedInputCode = `function validateEmail(value: string) {
  if (!value.includes('@')) return 'Invalid email';
  return null;
}

<TextInput
  bind:value={email}
  type="email"
  validate={validateEmail}
  required
/>`;

	const buttonVariantsCode = `<Button onclick={() => handleAction('Primary')}>Primary action</Button>
<Button variant="secondary">Secondary action</Button>
<Button variant="danger">Delete item</Button>`;

	const buttonStatesCode = `<Button loading={isSaving} loadingLabel="Saving…">
  Save changes
</Button>

<Button disabled>Unavailable</Button>

<Button type="submit" class="w-full">
  Submit form
</Button>`;

	const basicDatePickerCode = `<script lang="ts">
  import DatePicker from '$lib/components/DatePicker.svelte';

  let dueDate: string | null = null;
<\/script>

<DatePicker
  bind:value={dueDate}
  label="Due date"
  placeholder="No due date"
/>`;

	const constrainedDatePickerCode = `<DatePicker
  bind:value={appointmentDate}
  label="Appointment"
  min="2026-06-10"
  max="2026-06-20"
  locale="en-US"
  required
/>`;

	const basicTextareaCode = `<script lang="ts">
  import Textarea from '$lib/components/Textarea.svelte';

  let notes = '';
<\/script>

<Textarea
  bind:value={notes}
  label="Notes"
  description="Add context for the next person."
  rows={4}
  maxlength={500}
/>`;

	const validatedTextareaCode = `function validateSummary(value: string) {
  if (value.trim().length < 10) return 'Use at least 10 characters';
  return null;
}

<Textarea
  bind:value={summary}
  label="Summary"
  validate={validateSummary}
  resize="none"
  required
/>`;

	const editableLabelCode = `<script lang="ts">
  import EditableLabel from '$lib/components/EditableLabel.svelte';

  let displayName = 'Alex Morgan';
  let isSaving = false;

  function validateDisplayName(value: string) {
    if (!value.trim()) return 'Display name is required';
    return null;
  }

  function handleChange(event: CustomEvent<{ value: string }>) {
    console.log('Saved value:', event.detail.value);
  }
<\/script>

<EditableLabel
  bind:value={displayName}
  label="Display name"
  placeholder="Click to add a display name"
  validate={validateDisplayName}
  {isSaving}
  required
  on:change={handleChange}
/>`;

	const explicitEditableLabelCode = `<EditableLabel
  bind:value={displayName}
  label="Email"
  type="email"
  saveMode="explicit"
  {isSaving}
  on:change={handleChange}
/>`;

	const basicSelectCode = `let selected = null;
const options = ['Option 1', 'Option 2', 'Option 3'];

<Select
  {options}
  bind:selected
  label="Choose an option"
  placeholder="Select one..."
/>`;

	const selectWithValidationCode = `function validateSelection(value) {
  if (!value) return 'Please select an option';
  return null;
}

<Select
  options={['Low', 'Medium', 'High', 'Urgent']}
  bind:selected={priority}
  label="Priority"
  validate={validateSelection}
/>`;

	const selectWithCallbackCode = `<Select
  options={['Work', 'Personal', 'Shopping']}
  selected={category}
  label="Category"
  onSelect={(value) => {
    console.log('Selected:', value);
    // Handle selection
  }}
/>`;
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-4xl mx-auto">
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Component Library Showcase</h1>
			<p class="text-gray-600">
				{#if dev}
					<span class="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded text-sm">
						<span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
						Development mode — this route is hidden in production
					</span>
				{/if}
			</p>
		</div>

		<!-- Button Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">Button Component</h2>
			<p class="text-gray-600 mb-8">
				A native button primitive with consistent action variants, disabled and loading states,
				focus treatment, and support for standard button attributes and events.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Action Variants</h3>
					<div class="flex flex-wrap gap-3">
						<Button onclick={() => handleButtonAction('Primary')}>Primary action</Button>
						<Button variant="secondary" onclick={() => handleButtonAction('Secondary')}>
							Secondary action
						</Button>
						<Button variant="danger" onclick={() => handleButtonAction('Danger')}>
							Danger action
						</Button>
					</div>
					<p class="text-xs text-gray-500 mt-3">
						Last action: <code>{lastButtonAction}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">States</h3>
					<div class="flex flex-wrap gap-3">
						<Button disabled>Disabled</Button>
						<Button loading loadingLabel="Saving…">Save changes</Button>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Consumer Classes</h3>
					<Button class="w-full" variant="secondary" onclick={() => handleButtonAction('Full width')}>
						Full-width button
					</Button>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Native Submit Type</h3>
					<form onsubmit={handleButtonSubmit}>
						<Button type="submit">Submit example</Button>
					</form>
					<p class="text-xs text-gray-500 mt-2">Uses native form submission semantics.</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Variants and click handling:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{buttonVariantsCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">States, type, and class extension:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{buttonStatesCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">variant</td>
								<td class="px-4 py-2 text-gray-600">'primary' | 'secondary' | 'danger'</td>
								<td class="px-4 py-2 text-gray-600">'primary'</td>
								<td class="px-4 py-2 text-gray-600">Visual intent and color treatment.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">type</td>
								<td class="px-4 py-2 text-gray-600">'button' | 'submit' | 'reset'</td>
								<td class="px-4 py-2 text-gray-600">'button'</td>
								<td class="px-4 py-2 text-gray-600">Native button type.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Prevents activation.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">loading</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disables the button and exposes busy status.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">loadingLabel</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'Loading…'</td>
								<td class="px-4 py-2 text-gray-600">Content displayed while loading.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">class</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Additional classes merged with component styles.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">children</td>
								<td class="px-4 py-2 text-gray-600">Snippet</td>
								<td class="px-4 py-2 text-gray-600">required</td>
								<td class="px-4 py-2 text-gray-600">Text, icon, or combined button content.</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="text-sm text-gray-600 mt-4">
					Standard native button attributes and handlers such as <code>title</code>,
					<code>aria-label</code>, <code>data-*</code>, and <code>onclick</code> are forwarded.
				</p>
			</div>
		</section>

		<!-- DatePicker Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">DatePicker Component</h2>
			<p class="text-gray-600 mb-8">
				A custom, accessible calendar popover for selecting one nullable ISO date without
				timezone conversion.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Empty Value</h3>
					<DatePicker
						bind:value={emptyDate}
						label="Optional due date"
						placeholder="No due date"
						locale="en-US"
					/>
					<p class="text-xs text-gray-500 mt-2">
						ISO value: <code>{emptyDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Preselected Value</h3>
					<DatePicker bind:value={selectedDate} label="Release date" locale="en-US" />
					<p class="text-xs text-gray-500 mt-2">
						ISO value: <code>{selectedDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Constrained Range</h3>
					<DatePicker
						bind:value={constrainedDate}
						label="Appointment date"
						min="2026-06-10"
						max="2026-06-20"
						locale="en-US"
						required
					/>
					<p class="text-xs text-gray-500 mt-2">
						Allowed: <code>2026-06-10</code> through <code>2026-06-20</code>. Value:
						<code>{constrainedDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<DatePicker value="2026-06-09" label="Locked date" locale="en-US" disabled />
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Nullable ISO date:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{basicDatePickerCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Localized constrained date:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{constrainedDatePickerCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Keyboard Controls</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">← →</p>
						<p class="text-sm text-gray-600">Move one day.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">↑ ↓</p>
						<p class="text-sm text-gray-600">Move one week.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Home, End</p>
						<p class="text-sm text-gray-600">Move to Monday or Sunday of the week.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Page Up, Page Down</p>
						<p class="text-sm text-gray-600">Move to the previous or next month.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Enter, Space</p>
						<p class="text-sm text-gray-600">Select the focused date.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Escape</p>
						<p class="text-sm text-gray-600">Close without changing the value.</p>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Bindable YYYY-MM-DD calendar date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Visible trigger label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">placeholder</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'Select a date'</td>
								<td class="px-4 py-2 text-gray-600">Text shown for a null value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Displays the required marker.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disables the trigger and calendar.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">min</td>
								<td class="px-4 py-2 text-gray-600">string | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Inclusive minimum ISO date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">max</td>
								<td class="px-4 py-2 text-gray-600">string | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Inclusive maximum ISO date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">locale</td>
								<td class="px-4 py-2 text-gray-600">string | undefined</td>
								<td class="px-4 py-2 text-gray-600">runtime locale</td>
								<td class="px-4 py-2 text-gray-600">Intl locale for visible and accessible dates.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">ariaLabel</td>
								<td class="px-4 py-2 text-gray-600">string | undefined</td>
								<td class="px-4 py-2 text-gray-600">undefined</td>
								<td class="px-4 py-2 text-gray-600">Accessible trigger label override.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- Textarea Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">Textarea Component</h2>
			<p class="text-gray-600 mb-8">
				A native multiline text field with bindable values, validation, accessible descriptions,
				configurable rows and resize behavior, and standard textarea attribute forwarding.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Binding</h3>
					<Textarea
						bind:value={textareaValue}
						label="Project notes"
						description="Add context for the next person."
						placeholder="Enter project notes"
					/>
					<p class="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
						Bound value: <code>{textareaValue || '(empty)'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">With Validation</h3>
					<Textarea
						bind:value={validatedTextareaValue}
						label="Short summary"
						placeholder="Use at least 10 characters"
						validate={validateTextarea}
						resize="none"
					/>
					<p class="text-xs text-gray-500 mt-2">Validation runs on input and blur.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Required State</h3>
					<Textarea
						bind:value={requiredTextareaValue}
						label="Required context"
						description="This example uses the native required attribute."
						required
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<Textarea
						value="This content cannot be edited."
						label="Locked notes"
						disabled
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Row Configuration</h3>
					<Textarea
						label="Six-row notes"
						ariaLabel="Six-row notes"
						rows={6}
						maxlength={500}
						placeholder="Up to 500 characters"
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Resize Configuration</h3>
					<Textarea
						label="Horizontal resize notes"
						resize="horizontal"
						class="min-w-48"
						placeholder="Resize horizontally"
					/>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Binding and native attributes:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{basicTextareaCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Validation and resize behavior:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{validatedTextareaCode}</code></pre>
					</div>
				</div>
				<p class="text-sm text-gray-600 mt-4">
					Standard native textarea attributes and handlers such as <code>name</code>,
					<code>maxlength</code>, <code>autocomplete</code>, <code>data-*</code>,
					<code>oninput</code>, and <code>onblur</code> are forwarded.
				</p>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Bindable multiline value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Visible associated label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">description</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Accessible supporting text.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">placeholder</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Empty-value hint.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Native required state and marker.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disables text entry.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">rows</td>
								<td class="px-4 py-2 text-gray-600">number</td>
								<td class="px-4 py-2 text-gray-600">3</td>
								<td class="px-4 py-2 text-gray-600">Native visible row count.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">resize</td>
								<td class="px-4 py-2 text-gray-600">'none' | 'vertical' | 'horizontal' | 'both'</td>
								<td class="px-4 py-2 text-gray-600">'vertical'</td>
								<td class="px-4 py-2 text-gray-600">Allowed resize direction.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">validate</td>
								<td class="px-4 py-2 text-gray-600">(value: string) =&gt; string | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Synchronous input and blur validator.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">ariaLabel</td>
								<td class="px-4 py-2 text-gray-600">string | undefined</td>
								<td class="px-4 py-2 text-gray-600">undefined</td>
								<td class="px-4 py-2 text-gray-600">Accessible name for label-less usage.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">class</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Additional classes merged with component styles.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- TextInput Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">TextInput Component</h2>
			<p class="text-gray-600 mb-8">
				A reusable text input with optional custom validation. Displays error messages and applies error styling automatically.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Input</h3>
					<TextInput
						bind:value={searchQuery}
						label="Search"
						placeholder="Type something..."
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{searchQuery || '(empty)'}</code></p>
				</div>

				<!-- Password Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Password with Validation</h3>
					<TextInput
						bind:value={password}
						label="Password"
						type="password"
						placeholder="Enter a secure password"
						validate={validatePassword}
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{password || '(empty)'}</code></p>
				</div>

				<!-- Username Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Username with Custom Rules</h3>
					<TextInput
						bind:value={username}
						label="Username"
						placeholder="alphanumeric, -, _"
						validate={validateUsername}
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{username || '(empty)'}</code></p>
				</div>

				<!-- Disabled Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<TextInput
						label="Read-only Field"
						value="Cannot edit this"
						disabled
					/>
				</div>

				<!-- No Label Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Minimal (No Label)</h3>
					<TextInput
						placeholder="Just a placeholder"
					/>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Basic input:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{basicInputCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">With validation:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{validatedInputCode}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">The input value</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Label displayed above input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">type</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'text'</td>
								<td class="px-4 py-2 text-gray-600">HTML input type (text, email, password, etc.)</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">validate</td>
								<td class="px-4 py-2 text-gray-600">function | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Optional validator: (value) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disable the input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Mark as required (shows * in label)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- EditableLabel Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">EditableLabel Component</h2>
			<p class="text-gray-600 mb-8">
				An inline editable field that switches from a read-only label to an input. It supports
				validation, keyboard controls, and disabled or saving states without making persistence
				decisions for the consumer.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Editing</h3>
					<EditableLabel
						bind:value={editableName}
						label="Display name"
						placeholder="Click to add a display name"
						ariaLabel="Edit basic display name"
						on:change={handleEditableNameChange}
					/>
					<p class="text-xs text-gray-500 mt-2">
						Latest emitted value: <code>{latestEditableName}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">With Validation</h3>
					<EditableLabel
						bind:value={validatedEditableName}
						label="Validated display name"
						placeholder="Enter at least 3 characters"
						validate={validateEditableName}
						ariaLabel="Edit validated display name"
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Try an empty value or fewer than 3 characters.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Explicit Save</h3>
					<EditableLabel
						bind:value={explicitEditableName}
						label="Confirmed display name"
						placeholder="Click to edit"
						ariaLabel="Edit explicit display name"
						saveMode="explicit"
						on:change={handleExplicitEditableNameChange}
					/>
					<p class="text-xs text-gray-500 mt-2">
						Latest explicitly saved value: <code>{latestExplicitEditableName}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<EditableLabel
						bind:value={disabledEditableName}
						label="Disabled display name"
						ariaLabel="Disabled display name"
						disabled
					/>
					<p class="text-xs text-gray-500 mt-2">Editing is unavailable while disabled.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Saving State</h3>
					<EditableLabel
						bind:value={savingEditableName}
						label="Saving display name"
						ariaLabel="Saving display name"
						isSaving
					/>
					<p class="text-xs text-gray-500 mt-2">Editing is unavailable while a save is in progress.</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Automatic save (default):</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{editableLabelCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Explicit Save button:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{explicitEditableLabelCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Keyboard and Pointer Controls</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Click, Enter, Space</p>
						<p class="text-sm text-gray-600">Enter edit mode from the display label.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Automatic: Enter</p>
						<p class="text-sm text-gray-600">Validate and save the current edit.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Escape</p>
						<p class="text-sm text-gray-600">Cancel either mode and restore the previous value.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Automatic: Blur</p>
						<p class="text-sm text-gray-600">Validate and save when focus leaves the input.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Explicit: Save button</p>
						<p class="text-sm text-gray-600">The only action that validates and commits the draft.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Explicit: Enter</p>
						<p class="text-sm text-gray-600">Does not save; the editor remains open.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Explicit: Blur</p>
						<p class="text-sm text-gray-600">Discards the draft when focus leaves the editor.</p>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Displayed and edited value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Label shown above the input in edit mode.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">placeholder</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Fallback display text and input placeholder.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">type</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'text'</td>
								<td class="px-4 py-2 text-gray-600">HTML input type.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Prevents entering edit mode.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Marks the edit input as required.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">validate</td>
								<td class="px-4 py-2 text-gray-600">(value: string) =&gt; string | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Returns an error message or null.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">isSaving</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Prevents editing while persistence is active.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">ariaLabel</td>
								<td class="px-4 py-2 text-gray-600">string | undefined</td>
								<td class="px-4 py-2 text-gray-600">undefined</td>
								<td class="px-4 py-2 text-gray-600">Accessible name override.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">saveMode</td>
								<td class="px-4 py-2 text-gray-600">'automatic' | 'explicit'</td>
								<td class="px-4 py-2 text-gray-600">'automatic'</td>
								<td class="px-4 py-2 text-gray-600">Chooses automatic Enter/blur saving or button-confirmed saving.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Events Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Event</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Payload</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">change</td>
								<td class="px-4 py-2 text-gray-600">{'{ value: string }'}</td>
								<td class="px-4 py-2 text-gray-600">Emitted after a changed value passes validation and is saved.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- EmailInput Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">EmailInput Component</h2>
			<p class="text-gray-600 mb-8">
				A specialized text input that extends TextInput with built-in email validation. Validates email format including @ symbol and domain.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Email Input</h3>
					<EmailInput
						bind:value={email}
						label="Email Address"
						placeholder="your@email.com"
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{email || '(empty)'}</code></p>
				</div>

				<!-- Required Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Required Email</h3>
					<EmailInput
						value=""
						label="Email (Required)"
						placeholder="user@example.com"
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Shows error when left empty</p>
				</div>

				<!-- Disabled Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<EmailInput
						value="user@example.com"
						label="Read-only Email"
						disabled
					/>
				</div>

				<!-- Optional Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Optional Email</h3>
					<EmailInput
						value=""
						label="Email (Optional)"
						placeholder="leave empty or enter valid email"
						required={false}
					/>
					<p class="text-xs text-gray-500 mt-2">Valid when empty or contains valid email</p>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Basic usage:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<EmailInput
  bind:value={email}
  label="Email Address"
  placeholder="your@email.com"
/>`}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Required email:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<EmailInput
  bind:value={email}
  label="Email"
  required
/>`}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">With custom validation:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`function validateEmailDomain(email: string) {
  if (!email.endsWith('@company.com')) {
    return 'Only company emails allowed';
  }
  return null;
}

<EmailInput
  bind:value={email}
  label="Work Email"
  required
  customValidate={validateEmailDomain}
/>`}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">The email input value</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'Email'</td>
								<td class="px-4 py-2 text-gray-600">Label displayed above input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">placeholder</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'your@email.com'</td>
								<td class="px-4 py-2 text-gray-600">Placeholder text</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">true</td>
								<td class="px-4 py-2 text-gray-600">Whether email is required</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disable the input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">customValidate</td>
								<td class="px-4 py-2 text-gray-600">function | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Additional validator: (email) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">ariaLabel</td>
								<td class="px-4 py-2 text-gray-600">string | undefined</td>
								<td class="px-4 py-2 text-gray-600">undefined</td>
								<td class="px-4 py-2 text-gray-600">ARIA label for accessibility</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Validation Rules -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Built-in Validation Rules</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li class="flex items-start gap-3">
						<span class="text-blue-500 font-bold mt-0.5">•</span>
						<span><strong>Required validation:</strong> Shows "Email is required" if required and empty</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-blue-500 font-bold mt-0.5">•</span>
						<span><strong>@ symbol check:</strong> Email must include @ symbol</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-blue-500 font-bold mt-0.5">•</span>
						<span><strong>Local and domain parts:</strong> Both local (before @) and domain (after @) must be present and non-empty</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-blue-500 font-bold mt-0.5">•</span>
						<span><strong>Domain extension:</strong> Domain must contain a . (period)</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-blue-500 font-bold mt-0.5">•</span>
						<span><strong>Custom validation:</strong> Optional customValidate prop for domain-specific rules</span>
					</li>
				</ul>
			</div>
		</section>

		<!-- Select Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">Select Component</h2>
			<p class="text-gray-600 mb-8">
				A reusable single-select dropdown component with keyboard navigation, custom validation, and accessibility support (ARIA attributes, keyboard shortcuts).
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Select</h3>
					<Select
						options={fruits}
						selected={selectedFruit}
						label="Choose a Fruit"
						placeholder="Pick one..."
						onSelect={(value) => {
							selectedFruit = value;
						}}
					/>
					<p class="text-xs text-gray-500 mt-2">Selected: <code>{selectedFruit || '(none)'}</code></p>
				</div>

				<!-- Priority Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">With Validation</h3>
					<Select
						options={priorities}
						selected={selectedPriority}
						label="Priority Level"
						placeholder="Select priority..."
						validate={validateSelection}
						onSelect={(value) => {
							selectedPriority = value;
						}}
					/>
					<p class="text-xs text-gray-500 mt-2">Selected: <code>{selectedPriority || '(none)'}</code></p>
				</div>

				<!-- Category Example with Callback -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">With Callback</h3>
					<Select
						options={categories}
						selected={selectedCategory}
						label="Category"
						placeholder="Choose a category..."
						onSelect={(value) => {
							selectedCategory = value;
							console.log('Category selected:', value);
						}}
					/>
					<p class="text-xs text-gray-500 mt-2">Selected: <code>{selectedCategory || '(none)'}</code></p>
				</div>

				<!-- Disabled Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<Select
						options={fruits}
						selected="Apple"
						label="Read-only Select"
						disabled
					/>
				</div>

				<!-- Empty State Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Empty Options</h3>
					<Select
						options={[]}
						label="No Options"
						placeholder="Select an option..."
					/>
				</div>

				<!-- Minimal Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Minimal (No Label)</h3>
					<Select
						options={['Red', 'Green', 'Blue']}
						placeholder="Pick a color..."
					/>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Basic select:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{basicSelectCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">With validation:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{selectWithValidationCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">With callback:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{selectWithCallbackCode}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">options</td>
								<td class="px-4 py-2 text-gray-600">T[]</td>
								<td class="px-4 py-2 text-gray-600">[]</td>
								<td class="px-4 py-2 text-gray-600">Array of options to display</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">selected</td>
								<td class="px-4 py-2 text-gray-600">T | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">The currently selected option</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Label displayed above the dropdown</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">placeholder</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'Select an option'</td>
								<td class="px-4 py-2 text-gray-600">Placeholder text when no option is selected</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">validate</td>
								<td class="px-4 py-2 text-gray-600">function | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Optional validator: (value) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">onSelect</td>
								<td class="px-4 py-2 text-gray-600">function | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Callback fired when an option is selected: (value) => void</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disable the dropdown</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Keyboard Shortcuts -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Keyboard Shortcuts</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Enter, Space, ↓</p>
						<p class="text-sm text-gray-600">Open dropdown (when closed)</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">↑ ↓</p>
						<p class="text-sm text-gray-600">Navigate between options</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Home, End</p>
						<p class="text-sm text-gray-600">Jump to first/last option</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Enter</p>
						<p class="text-sm text-gray-600">Select focused option</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Escape</p>
						<p class="text-sm text-gray-600">Close dropdown</p>
					</div>
					<div>
						<p class="font-mono text-sm text-blue-600 mb-1">Click outside</p>
						<p class="text-sm text-gray-600">Close dropdown</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Future Components Notice -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h3 class="font-semibold text-blue-900 mb-2">Coming Soon</h3>
			<p class="text-blue-800 text-sm">
				ItemCard and other components will be added to this showcase as they are implemented.
			</p>
		</div>
	</div>
</div>
