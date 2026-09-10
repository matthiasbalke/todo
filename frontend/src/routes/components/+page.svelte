<script lang="ts">
	import { controlTextRoles } from '$lib/components/controlStyles';
	import { dev } from '$app/environment';
	import TextInput from '$lib/components/TextInput.svelte';
	import CategorySelect from '$lib/components/CategorySelect.svelte';
	import EmailInput from '$lib/components/EmailInput.svelte';
	import MemberInviteEmailInput from '$lib/components/MemberInviteEmailInput.svelte';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import Select from '$lib/components/Select.svelte';
	import EditableLabel from '$lib/components/EditableLabel.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import CalendarDayButton from '$lib/components/CalendarDayButton.svelte';
	import ColorSwatchButton from '$lib/components/ColorSwatchButton.svelte';
	import CompletionToggle from '$lib/components/CompletionToggle.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import StarToggle from '$lib/components/StarToggle.svelte';
	import SwipeDeleteAction from '$lib/components/SwipeDeleteAction.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Toggle from '$lib/components/Toggle.svelte';

	let lastButtonAction = 'None';
	let showcaseCalendarSelected = true;
	let showcaseColor = '#60a5fa';
	let showcaseDone = false;
	let showcaseStarred = false;
	let showcaseToggle = false;
	let lastToggleChange = 'None';
	let emptyDate: string | null = null;
	let selectedDate: string | null = '2026-06-09';
	let constrainedDate: string | null = '2026-06-15';
	let textareaValue = 'Plan the first milestone.';
	let validatedTextareaValue = '';
	let requiredTextareaValue = '';
	let email = '';
	let inviteEmail = '';
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
	let selectedFruits: string[] = [];
	let selectedPriority: string | null = null;
	let selectedCategory: string | null = null;
	let selectedCategoryId: string | null = 'showcase-produce';
	let selectedTimeZone: string | null = 'Europe/Berlin';
	let selectedAssignees = [
		{ id: 'showcase-riley', name: 'Riley Chen' },
		{ id: 'showcase-morgan', name: 'Morgan Reed' }
	];
	let latestAssigneeSelection = selectedAssignees.map((assignee) => assignee.id).join(', ');

	const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig'];
	const priorities = ['Low', 'Medium', 'High', 'Urgent'];
	const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance'];
	const categorySelectCategories = [
		{ id: 'showcase-produce', listId: 'showcase-list', name: 'Produce', color: '#22c55e', sortOrder: 1 },
		{ id: 'showcase-household', listId: 'showcase-list', name: 'Household', color: null, sortOrder: 2 },
		{ id: 'showcase-bakery', listId: 'showcase-list', name: 'Bakery', color: '#f59e0b', sortOrder: 3 }
	];
	const memberSuggestions = [
		{ userId: 'showcase-casey', email: 'casey@example.com', displayName: 'Casey Stone' },
		{ userId: 'showcase-riley', email: 'riley@example.com', displayName: 'Riley Chen' },
		{ userId: 'showcase-morgan', email: 'morgan@example.com', displayName: 'Morgan Reed' }
	];
	const assigneeOptions = [
		{ id: 'showcase-casey', name: 'Casey Stone' },
		{ id: 'showcase-riley', name: 'Riley Chen' },
		{ id: 'showcase-morgan', name: 'Morgan Reed' },
		{ id: 'showcase-taylor', name: 'Taylor Brooks' }
	];

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

	function handleAssigneeSelection(values: typeof assigneeOptions) {
		latestAssigneeSelection = values.map((assignee) => assignee.id).join(', ') || '(none)';
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
<Button tone="neutral" appearance="outline">Secondary action</Button>
<Button tone="danger" appearance="solid">Delete item</Button>
<Button tone="neutral" appearance="ghost" size="icon" aria-label="Open menu">⋮</Button>
<Button tone="neutral" appearance="bare" size="menu" align="start" weight="normal">Menu item</Button>`;

	const buttonStatesCode = `<Button loading={isSaving} loadingLabel="Saving…">
  Save changes
</Button>

<Button disabled>Unavailable</Button>

<Button type="submit" class="w-full">
  Submit form
</Button>`;

	const toggleCode = `<script lang="ts">
  import Toggle from '$lib/components/Toggle.svelte';

  let enabled = false;
<\/script>

<label id="notifications-label">Notifications</label>
<Toggle
  bind:checked={enabled}
  aria-labelledby="notifications-label"
  onchange={(checked) => console.log('Changed:', checked)}
/>`;

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

	const multiSelectCode = `<script lang="ts">
  import MultiSelect from '$lib/components/MultiSelect.svelte';

  const assignees = [
    { id: 'casey', name: 'Casey Stone' },
    { id: 'riley', name: 'Riley Chen' }
  ];
  let selectedAssignees = $state([]);
<\/script>

<MultiSelect
  options={assignees}
  bind:selected={selectedAssignees}
  label="Assignees"
  placeholder="Choose assignees"
  getOptionLabel={(assignee) => assignee.name}
  optionKey={(assignee) => assignee.id}
>
  {#snippet selectedContent(assignee)}
    <span>{assignee.name}</span>
  {/snippet}

  {#snippet optionContent(assignee)}
    <span>{assignee.name}</span>
  {/snippet}
</MultiSelect>`;

	const timezonePickerCode = `<script lang="ts">
  import TimezonePicker from '$lib/components/TimezonePicker.svelte';

  let timeZone: string | null = 'UTC';
<\/script>

<TimezonePicker
  bind:selected={timeZone}
  label="Timezone"
  onSelect={(value) => console.log('Selected IANA timezone:', value)}
/>`;

	const categorySelectCode = `<script lang="ts">
  import CategorySelect from '$lib/components/CategorySelect.svelte';

  let categoryId: string | null = null;
  const categories = [
    { id: 'produce', listId: 'grocery', name: 'Produce', color: '#22c55e', sortOrder: 1 },
    { id: 'household', listId: 'grocery', name: 'Household', color: null, sortOrder: 2 }
  ];
<\/script>

<CategorySelect
  {categories}
  bind:selectedCategoryId={categoryId}
  label="Category"
/>`;

	const memberInviteEmailInputCode = `<script lang="ts">
  import MemberInviteEmailInput from '$lib/components/MemberInviteEmailInput.svelte';

  let inviteEmail = '';
  const suggestions = [
    { userId: 'casey', email: 'casey@example.com', displayName: 'Casey Stone' }
  ];
<\/script>

<MemberInviteEmailInput
  bind:value={inviteEmail}
  {suggestions}
  label="Invite member"
  placeholder="Email address"
/>`;

	const iconCode = `<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
<\/script>

<Icon name="plus" />
<Icon name="menu" label="Open menu" size="header" />
<Icon name="done" size="itemStatus" class="text-success" />`;
	const sections = [
		{ id: 'foundation', label: 'Style Foundation', title: 'Shared Style Foundation', content: foundationSection },
		{ id: 'button', label: 'Button', title: 'Button Component', content: buttonSection },
		{ id: 'icon', label: 'Icon', title: 'Icon Component', content: iconSection },
		{ id: 'toggle', label: 'Toggle', title: 'Toggle Component', content: toggleSection },
		{ id: 'specialized-interaction-controls', label: 'Specialized Interaction Controls', title: 'Specialized Interaction Controls', content: specialized_interaction_controlsSection },
		{ id: 'date-picker', label: 'DatePicker', title: 'DatePicker Component', content: date_pickerSection },
		{ id: 'textarea', label: 'Textarea', title: 'Textarea Component', content: textareaSection },
		{ id: 'text-input', label: 'TextInput', title: 'TextInput Component', content: text_inputSection },
		{ id: 'editable-label', label: 'EditableLabel', title: 'EditableLabel Component', content: editable_labelSection },
		{ id: 'email-input', label: 'EmailInput', title: 'EmailInput Component', content: email_inputSection },
		{ id: 'member-invite-email-input', label: 'MemberInviteEmailInput', title: 'MemberInviteEmailInput Component', content: member_invite_email_inputSection },
		{ id: 'select', label: 'Select', title: 'Select Component', content: selectSection },
		{ id: 'multi-select', label: 'MultiSelect', title: 'MultiSelect Component', content: multi_selectSection },
		{ id: 'category-select', label: 'CategorySelect', title: 'CategorySelect Component', content: category_selectSection },
		{ id: 'timezone-picker', label: 'TimezonePicker', title: 'TimezonePicker Component', content: timezone_pickerSection }
	];
</script>

{#snippet foundationSection()}
 <p class="typography-supporting mb-6">Shared roles keep controls and app surfaces consistent. Use the development palette control to inspect the alternate palette, then restore the default.</p>
 <div class="grid gap-6 md:grid-cols-2">
  <div class="space-y-3">
   {#each Object.entries(controlTextRoles) as [role, classes]}
    <p class={classes} data-testid={'foundation-role-' + role}>{role}: The quick brown fox</p>
   {/each}
  </div>
  <div class="space-y-3">
   <div class="rounded border border-border bg-canvas p-3 text-value">Canvas and text</div>
   <div class="rounded border border-primary-border bg-primary-surface p-3 text-primary-strong">Primary surface and foreground</div>
   <div class="rounded border border-danger-border bg-danger-surface p-3 text-danger-strong">Danger surface and foreground</div>
   <div class="rounded border border-success-border bg-success-surface p-3 text-success-strong">Success surface and foreground</div>
  </div>
  <div class="space-y-4">
   <TextInput label="Foundation value" value="Shared text" description="Supporting text uses a shared role" />
   <TextInput label="Foundation placeholder" placeholder="add note" />
   <Textarea label="Foundation notes" placeholder="add note" />
   <TextInput label="Foundation disabled" value="Unavailable" disabled />
   <TextInput label="Foundation validation" placeholder="Type to validate" validate={(value) => value.length < 5 ? 'Enter at least five characters' : null} />
  </div>
  <div class="space-y-4">
   <div class="flex flex-wrap gap-3">
    <Button>Foundation primary</Button>
    <Button tone="danger">Foundation danger</Button>
    <Button disabled>Foundation disabled action</Button>
    <Button tone="neutral" appearance="bare" selected>Foundation selected</Button>
    <Button tone="neutral" appearance="outline" invalid>Foundation invalid</Button>
   </div>
   <Select label="Foundation menu" options={['First option', 'Second option']} />
   <p class="typography-supporting">Hover or focus controls to inspect their interaction states. Compact spacing and text roles are independent.</p>
  </div>
 </div>
{/snippet}

{#snippet buttonSection()}
			<p class="text-supporting mb-8">
				A native button primitive with semantic tones, appearances, disabled and loading states,
				focus treatment, and support for standard button attributes and events.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Tone And Appearance</h3>
					<div class="flex flex-wrap gap-3">
						<Button onclick={() => handleButtonAction('Primary')}>Primary action</Button>
						<Button tone="neutral" appearance="outline" onclick={() => handleButtonAction('Secondary')}>
							Secondary action
						</Button>
						<Button tone="danger" appearance="solid" onclick={() => handleButtonAction('Danger')}>
							Danger action
						</Button>
						<Button tone="neutral" appearance="ghost" onclick={() => handleButtonAction('Ghost')}>Ghost action</Button>
						<Button tone="neutral" appearance="bare" size="icon" aria-label="Icon action">⋮</Button>
					</div>
					<p class="text-xs text-muted mt-3">
						Last action: <code>{lastButtonAction}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">States</h3>
					<div class="flex flex-wrap gap-3">
						<Button disabled>Disabled</Button>
						<Button loading loadingLabel="Saving…">Save changes</Button>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Layout And State</h3>
					<Button class="w-full" tone="neutral" appearance="outline" align="start" onclick={() => handleButtonAction('Full width')}>
						Full-width button
					</Button>
					<Button class="w-full mt-2" tone="neutral" appearance="bare" size="menu" align="between" weight="normal" selected>
						<span>Selected menu option</span><span>✓</span>
					</Button>
					<p class="text-xs text-muted mt-2">Menu rows use regular weight; selected options use blue text and a selection indicator.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Icon Touch Targets</h3>
					<div class="flex flex-wrap items-center gap-3">
						<Button tone="neutral" appearance="ghost" size="icon-compact" aria-label="Compact icon action">
							<Icon name="menu" size="compact" />
						</Button>
						<Button tone="neutral" appearance="ghost" size="icon-standard" aria-label="Standard icon action">
							<Icon name="menu" size="action" />
						</Button>
						<Button tone="neutral" appearance="ghost" size="icon-header" aria-label="Header icon action">
							<Icon name="menu" size="header" />
						</Button>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Native Submit Type</h3>
					<form onsubmit={handleButtonSubmit}>
						<Button type="submit">Submit example</Button>
					</form>
					<p class="text-xs text-muted mt-2">Uses native form submission semantics.</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Tone, appearance, and click handling:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{buttonVariantsCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">States, type, and layout classes:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{buttonStatesCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">tone</td>
								<td class="px-4 py-2 text-supporting">'primary' | 'neutral' | 'danger' | 'success'</td>
								<td class="px-4 py-2 text-supporting">'primary'</td>
								<td class="px-4 py-2 text-supporting">Semantic intent and color family.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">appearance</td>
								<td class="px-4 py-2 text-supporting">'solid' | 'outline' | 'soft' | 'ghost' | 'bare'</td>
								<td class="px-4 py-2 text-supporting">'solid'</td>
								<td class="px-4 py-2 text-supporting">Visual treatment independent of semantic tone.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">size</td>
								<td class="px-4 py-2 text-supporting">Named action, menu, field, row, title, chip, and backdrop geometry.</td>
								<td class="px-4 py-2 text-supporting">'default'</td>
								<td class="px-4 py-2 text-supporting">Named geometry for form, menu, chip, icon, and backdrop actions.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">align</td>
								<td class="px-4 py-2 text-supporting">'center' | 'start' | 'between'</td>
								<td class="px-4 py-2 text-supporting">'center'</td>
								<td class="px-4 py-2 text-supporting">Horizontal content alignment for full-width rows and menus.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">weight</td>
								<td class="px-4 py-2 text-supporting">'normal' | 'medium' | 'bold'</td>
								<td class="px-4 py-2 text-supporting">'medium'</td>
								<td class="px-4 py-2 text-supporting">Font weight, including regular typography for menu rows.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">selected</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Applies the shared selected-option presentation.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">type</td>
								<td class="px-4 py-2 text-supporting">'button' | 'submit' | 'reset'</td>
								<td class="px-4 py-2 text-supporting">'button'</td>
								<td class="px-4 py-2 text-supporting">Native button type.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Prevents activation.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">loading</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disables the button and exposes busy status.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">loadingLabel</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Loading…'</td>
								<td class="px-4 py-2 text-supporting">Content displayed while loading.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">class</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Parent-layout utilities only, such as width, margin, or flex participation.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">children</td>
								<td class="px-4 py-2 text-supporting">Snippet</td>
								<td class="px-4 py-2 text-supporting">required</td>
								<td class="px-4 py-2 text-supporting">Text, icon, or combined button content.</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="text-sm text-supporting mt-4">
					Standard native button attributes and handlers such as <code>title</code>,
					<code>aria-label</code>, <code>data-*</code>, and <code>onclick</code> are forwarded.
				</p>
			</div>
{/snippet}

{#snippet iconSection()}
			<p class="text-supporting mb-8">
				A semantic Lucide-backed icon wrapper with shared app names, decorative defaults,
				accessible labels, and named sizing presets.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Semantic Names</h3>
					<div class="flex flex-wrap items-center gap-4 text-label">
						<span class="inline-flex items-center gap-2"><Icon name="back" /> back</span>
						<span class="inline-flex items-center gap-2"><Icon name="menu" /> menu</span>
						<span class="inline-flex items-center gap-2"><Icon name="plus" /> plus</span>
						<span class="inline-flex items-center gap-2"><Icon name="group" /> group</span>
						<span class="inline-flex items-center gap-2"><Icon name="expand" /> expand</span>
						<span class="inline-flex items-center gap-2"><Icon name="collapse" /> collapse</span>
						<span class="inline-flex items-center gap-2"><Icon name="status" /> status</span>
						<span class="inline-flex items-center gap-2"><Icon name="done" /> done</span>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Sizing Presets</h3>
					<div class="flex flex-wrap items-end gap-5 text-label">
						<span class="inline-flex flex-col items-center gap-2 text-xs">
							<Icon name="star" size="metadata" />
							metadata
						</span>
						<span class="inline-flex flex-col items-center gap-2 text-xs">
							<Icon name="star" size="compact" />
							compact
						</span>
						<span class="inline-flex flex-col items-center gap-2 text-xs">
							<Icon name="star" size="action" />
							action
						</span>
						<span class="inline-flex flex-col items-center gap-2 text-xs">
							<Icon name="star" size="header" />
							header
						</span>
						<span class="inline-flex flex-col items-center gap-2 text-xs">
							<Icon name="done" size="itemStatus" class="text-success" />
							itemStatus
						</span>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Accessible Icon</h3>
					<div class="inline-flex items-center gap-3 rounded border border-border px-3 py-2">
						<Icon name="menu" label="Open menu example" size="header" />
						<span class="text-sm text-supporting">Screen-reader named icon</span>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{iconCode}</code></pre>
			</div>
{/snippet}

{#snippet toggleSection()}
			<p class="text-supporting mb-8">
				An accessible switch for persistent boolean settings. Toggle owns its track, thumb,
				state, focus, transition, and disabled presentation.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="flex items-center justify-between gap-4">
					<span id="toggle-off-label" class="text-sm font-medium text-label">Off example</span>
					<Toggle aria-labelledby="toggle-off-label" />
				</div>
				<div class="flex items-center justify-between gap-4">
					<span id="toggle-on-label" class="text-sm font-medium text-label">On example</span>
					<Toggle checked aria-labelledby="toggle-on-label" />
				</div>
				<div class="flex items-center justify-between gap-4">
					<span id="toggle-disabled-label" class="text-sm font-medium text-label">Disabled example</span>
					<Toggle checked disabled aria-labelledby="toggle-disabled-label" />
				</div>
				<div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-sm font-medium text-label">Bound example</span>
						<Toggle
							bind:checked={showcaseToggle}
							ariaLabel="Bound example"
							onchange={(checked) => { lastToggleChange = String(checked); }}
						/>
					</div>
					<p class="text-xs text-muted mt-2">
						Bound value: <code>{showcaseToggle}</code>; callback: <code>{lastToggleChange}</code>
					</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{toggleCode}</code></pre>
				<p class="text-sm text-supporting mt-4">
					Provide an accessible name with <code>ariaLabel</code> or
					<code>aria-labelledby</code>. Standard native button attributes and handlers are
					forwarded.
				</p>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr><td class="px-4 py-2 font-mono text-primary">checked</td><td class="px-4 py-2 text-supporting">Bindable boolean state.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">disabled</td><td class="px-4 py-2 text-supporting">Prevents activation and applies disabled feedback.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">ariaLabel</td><td class="px-4 py-2 text-supporting">Accessible name when no external label is referenced.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">onchange</td><td class="px-4 py-2 text-supporting">Receives the updated boolean after activation.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">id</td><td class="px-4 py-2 text-supporting">Native button identifier.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">class</td><td class="px-4 py-2 text-supporting">Parent-layout utilities only.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">element</td><td class="px-4 py-2 text-supporting">Bindable native button reference.</td></tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet specialized_interaction_controlsSection()}
			<p class="text-supporting mb-8">
				Domain controls own state-dependent visuals and accessibility while parents keep business
				and gesture orchestration.
			</p>
			<div class="flex flex-wrap items-center gap-8">
				<div role="grid" aria-label="Calendar day example" class="w-10">
					<CalendarDayButton
						value="2026-06-09"
						day={9}
						label="Tuesday, June 9, 2026"
						selected={showcaseCalendarSelected}
						current
						focused
						onclick={() => { showcaseCalendarSelected = !showcaseCalendarSelected; }}
					/>
				</div>
				<ColorSwatchButton
					color={showcaseColor}
					selected
					label="Selected blue category"
					onselect={() => { showcaseColor = showcaseColor === '#60a5fa' ? '#4ade80' : '#60a5fa'; }}
				/>
				<CompletionToggle done={showcaseDone} onactivate={() => { showcaseDone = !showcaseDone; }} />
				<StarToggle starred={showcaseStarred} onactivate={() => { showcaseStarred = !showcaseStarred; }} />
				<CompletionToggle size="form" done={showcaseDone} onactivate={() => { showcaseDone = !showcaseDone; }} />
				<StarToggle size="form" starred={showcaseStarred} onactivate={() => { showcaseStarred = !showcaseStarred; }} />
				<div class="h-12">
					<SwipeDeleteAction label="Delete example item" />
				</div>
			</div>
			<p class="text-sm text-supporting mt-6">
				Consumers pass date, color, completion, star, and geometry state without visual utility
				classes.
			</p>
{/snippet}

{#snippet date_pickerSection()}
			<p class="text-supporting mb-8">
				A custom, accessible calendar popover for selecting one nullable ISO date without
				timezone conversion.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Empty Value</h3>
					<DatePicker
						bind:value={emptyDate}
						label="Optional due date"
						placeholder="No due date"
						locale="en-US"
					/>
					<p class="text-xs text-muted mt-2">
						ISO value: <code>{emptyDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Preselected Value</h3>
					<DatePicker bind:value={selectedDate} label="Release date" locale="en-US" />
					<p class="text-xs text-muted mt-2">
						ISO value: <code>{selectedDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Constrained Range</h3>
					<DatePicker
						bind:value={constrainedDate}
						label="Appointment date"
						min="2026-06-10"
						max="2026-06-20"
						locale="en-US"
						required
					/>
					<p class="text-xs text-muted mt-2">
						Allowed: <code>2026-06-10</code> through <code>2026-06-20</code>. Value:
						<code>{constrainedDate ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<DatePicker value="2026-06-09" label="Locked date" locale="en-US" disabled />
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Nullable ISO date:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{basicDatePickerCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Localized constrained date:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{constrainedDatePickerCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Keyboard Controls</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-primary mb-1">← →</p>
						<p class="text-sm text-supporting">Move one day.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">↑ ↓</p>
						<p class="text-sm text-supporting">Move one week.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Home, End</p>
						<p class="text-sm text-supporting">Move to Monday or Sunday of the week.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Page Up, Page Down</p>
						<p class="text-sm text-supporting">Move to the previous or next month.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Enter, Space</p>
						<p class="text-sm text-supporting">Select the focused date.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Escape</p>
						<p class="text-sm text-supporting">Close without changing the value.</p>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Bindable YYYY-MM-DD calendar date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Visible trigger label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Select a date'</td>
								<td class="px-4 py-2 text-supporting">Text shown for a null value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Displays the required marker.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disables the trigger and calendar.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">min</td>
								<td class="px-4 py-2 text-supporting">string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Inclusive minimum ISO date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">max</td>
								<td class="px-4 py-2 text-supporting">string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Inclusive maximum ISO date.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">locale</td>
								<td class="px-4 py-2 text-supporting">string | undefined</td>
								<td class="px-4 py-2 text-supporting">runtime locale</td>
								<td class="px-4 py-2 text-supporting">Intl locale for visible and accessible dates.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">ariaLabel</td>
								<td class="px-4 py-2 text-supporting">string | undefined</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">Accessible trigger label override.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet textareaSection()}
			<p class="text-supporting mb-8">
				A native multiline text field with bindable values, validation, accessible descriptions,
				configurable rows and resize behavior, and standard textarea attribute forwarding.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Basic Binding</h3>
					<Textarea
						bind:value={textareaValue}
						label="Project notes"
						description="Add context for the next person."
						placeholder="Enter project notes"
					/>
					<p class="text-xs text-muted mt-2 whitespace-pre-wrap">
						Bound value: <code>{textareaValue || '(empty)'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">With Validation</h3>
					<Textarea
						bind:value={validatedTextareaValue}
						label="Short summary"
						placeholder="Use at least 10 characters"
						validate={validateTextarea}
						resize="none"
					/>
					<p class="text-xs text-muted mt-2">Validation runs on input and blur.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Required State</h3>
					<Textarea
						bind:value={requiredTextareaValue}
						label="Required context"
						description="This example uses the native required attribute."
						required
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<Textarea
						value="This content cannot be edited."
						label="Locked notes"
						disabled
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Row Configuration</h3>
					<Textarea
						label="Six-row notes"
						ariaLabel="Six-row notes"
						rows={6}
						maxlength={500}
						placeholder="Up to 500 characters"
					/>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Resize Configuration</h3>
					<Textarea
						label="Horizontal resize notes"
						resize="horizontal"
						class="min-w-48"
						placeholder="Resize horizontally"
					/>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Binding and native attributes:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{basicTextareaCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Validation and resize behavior:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{validatedTextareaCode}</code></pre>
					</div>
				</div>
				<p class="text-sm text-supporting mt-4">
					Standard native textarea attributes and handlers such as <code>name</code>,
					<code>maxlength</code>, <code>autocomplete</code>, <code>data-*</code>,
					<code>oninput</code>, and <code>onblur</code> are forwarded.
				</p>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Bindable multiline value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Visible associated label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">description</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Accessible supporting text.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Empty-value hint.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Native required state and marker.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disables text entry.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">rows</td>
								<td class="px-4 py-2 text-supporting">number</td>
								<td class="px-4 py-2 text-supporting">3</td>
								<td class="px-4 py-2 text-supporting">Native visible row count.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">resize</td>
								<td class="px-4 py-2 text-supporting">'none' | 'vertical' | 'horizontal' | 'both'</td>
								<td class="px-4 py-2 text-supporting">'vertical'</td>
								<td class="px-4 py-2 text-supporting">Allowed resize direction.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">validate</td>
								<td class="px-4 py-2 text-supporting">(value: string) =&gt; string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Synchronous input and blur validator.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">ariaLabel</td>
								<td class="px-4 py-2 text-supporting">string | undefined</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">Accessible name for label-less usage.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">class</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Additional classes merged with component styles.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet text_inputSection()}
			<p class="text-supporting mb-8">
				A reusable text input with optional custom validation. Displays error messages and applies error styling automatically.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Basic Input</h3>
					<TextInput
						bind:value={searchQuery}
						label="Search"
						placeholder="Type something..."
					/>
					<p class="text-xs text-muted mt-2">Value: <code>{searchQuery || '(empty)'}</code></p>
				</div>

				<!-- Password Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Password with Validation</h3>
					<TextInput
						bind:value={password}
						label="Password"
						type="password"
						placeholder="Enter a secure password"
						validate={validatePassword}
						required
					/>
					<p class="text-xs text-muted mt-2">Value: <code>{password || '(empty)'}</code></p>
				</div>

				<!-- Username Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Username with Custom Rules</h3>
					<TextInput
						bind:value={username}
						label="Username"
						placeholder="alphanumeric, -, _"
						validate={validateUsername}
						required
					/>
					<p class="text-xs text-muted mt-2">Value: <code>{username || '(empty)'}</code></p>
				</div>

				<!-- Disabled Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<TextInput
						label="Read-only Field"
						value="Cannot edit this"
						disabled
					/>
				</div>

				<!-- No Label Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Minimal (No Label)</h3>
					<TextInput
						placeholder="Just a placeholder"
					/>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Basic input:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{basicInputCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">With validation:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{validatedInputCode}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">The input value</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Label displayed above input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">type</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'text'</td>
								<td class="px-4 py-2 text-supporting">HTML input type (text, email, password, etc.)</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">validate</td>
								<td class="px-4 py-2 text-supporting">function | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Optional validator: (value) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disable the input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Mark as required (shows * in label)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet editable_labelSection()}
			<p class="text-supporting mb-8">
				An inline editable field that switches from a read-only label to an input. It supports
				validation, keyboard controls, and disabled or saving states without making persistence
				decisions for the consumer.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Basic Editing</h3>
					<EditableLabel
						bind:value={editableName}
						label="Display name"
						placeholder="Click to add a display name"
						ariaLabel="Edit basic display name"
						on:change={handleEditableNameChange}
					/>
					<p class="text-xs text-muted mt-2">
						Latest emitted value: <code>{latestEditableName}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">With Validation</h3>
					<EditableLabel
						bind:value={validatedEditableName}
						label="Validated display name"
						placeholder="Enter at least 3 characters"
						validate={validateEditableName}
						ariaLabel="Edit validated display name"
						required
					/>
					<p class="text-xs text-muted mt-2">Try an empty value or fewer than 3 characters.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Explicit Save</h3>
					<EditableLabel
						bind:value={explicitEditableName}
						label="Confirmed display name"
						placeholder="Click to edit"
						ariaLabel="Edit explicit display name"
						saveMode="explicit"
						on:change={handleExplicitEditableNameChange}
					/>
					<p class="text-xs text-muted mt-2">
						Latest explicitly saved value: <code>{latestExplicitEditableName}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<EditableLabel
						bind:value={disabledEditableName}
						label="Disabled display name"
						ariaLabel="Disabled display name"
						disabled
					/>
					<p class="text-xs text-muted mt-2">Editing is unavailable while disabled.</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Saving State</h3>
					<EditableLabel
						bind:value={savingEditableName}
						label="Saving display name"
						ariaLabel="Saving display name"
						isSaving
					/>
					<p class="text-xs text-muted mt-2">Editing is unavailable while a save is in progress.</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Automatic save (default):</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{editableLabelCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Explicit Save button:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{explicitEditableLabelCode}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Keyboard and Pointer Controls</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-primary mb-1">Click, Enter, Space</p>
						<p class="text-sm text-supporting">Enter edit mode from the display label.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Automatic: Enter</p>
						<p class="text-sm text-supporting">Validate and save the current edit.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Escape</p>
						<p class="text-sm text-supporting">Cancel either mode and restore the previous value.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Automatic: Blur</p>
						<p class="text-sm text-supporting">Validate and save when focus leaves the input.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Explicit: Save button</p>
						<p class="text-sm text-supporting">The only action that validates and commits the draft.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Explicit: Enter</p>
						<p class="text-sm text-supporting">Does not save; the editor remains open.</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Explicit: Blur</p>
						<p class="text-sm text-supporting">Discards the draft when focus leaves the editor.</p>
					</div>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Displayed and edited value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Label shown above the input in edit mode.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Fallback display text and input placeholder.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">type</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'text'</td>
								<td class="px-4 py-2 text-supporting">HTML input type.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Prevents entering edit mode.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Marks the edit input as required.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">validate</td>
								<td class="px-4 py-2 text-supporting">(value: string) =&gt; string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Returns an error message or null.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">isSaving</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Prevents editing while persistence is active.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">ariaLabel</td>
								<td class="px-4 py-2 text-supporting">string | undefined</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">Accessible name override.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">saveMode</td>
								<td class="px-4 py-2 text-supporting">'automatic' | 'explicit'</td>
								<td class="px-4 py-2 text-supporting">'automatic'</td>
								<td class="px-4 py-2 text-supporting">Chooses automatic Enter/blur saving or button-confirmed saving.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Events Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Event</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Payload</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">change</td>
								<td class="px-4 py-2 text-supporting">{'{ value: string }'}</td>
								<td class="px-4 py-2 text-supporting">Emitted after a changed value passes validation and is saved.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet email_inputSection()}
			<p class="text-supporting mb-8">
				A specialized text input that extends TextInput with built-in email validation. Validates email format including @ symbol and domain.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Basic Email Input</h3>
					<EmailInput
						bind:value={email}
						label="Email Address"
						placeholder="your@email.com"
					/>
					<p class="text-xs text-muted mt-2">Value: <code>{email || '(empty)'}</code></p>
				</div>

				<!-- Required Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Required Email</h3>
					<EmailInput
						value=""
						label="Email (Required)"
						placeholder="user@example.com"
						required
					/>
					<p class="text-xs text-muted mt-2">Shows error when left empty</p>
				</div>

				<!-- Disabled Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<EmailInput
						value="user@example.com"
						label="Read-only Email"
						disabled
					/>
				</div>

				<!-- Optional Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Optional Email</h3>
					<EmailInput
						value=""
						label="Email (Optional)"
						placeholder="leave empty or enter valid email"
						required={false}
					/>
					<p class="text-xs text-muted mt-2">Valid when empty or contains valid email</p>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Basic usage:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{`<EmailInput
  bind:value={email}
  label="Email Address"
  placeholder="your@email.com"
/>`}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Required email:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{`<EmailInput
  bind:value={email}
  label="Email"
  required
/>`}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">With custom validation:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{`function validateEmailDomain(email: string) {
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
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">The email input value</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Email'</td>
								<td class="px-4 py-2 text-supporting">Label displayed above input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'your@email.com'</td>
								<td class="px-4 py-2 text-supporting">Placeholder text</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">true</td>
								<td class="px-4 py-2 text-supporting">Whether email is required</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disable the input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">customValidate</td>
								<td class="px-4 py-2 text-supporting">function | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Additional validator: (email) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">ariaLabel</td>
								<td class="px-4 py-2 text-supporting">string | undefined</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">ARIA label for accessibility</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Validation Rules -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Built-in Validation Rules</h3>
				<ul class="space-y-2 text-sm text-label">
					<li class="flex items-start gap-3">
						<span class="text-primary-indicator font-bold mt-0.5">•</span>
						<span><strong>Required validation:</strong> Shows "Email is required" if required and empty</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-primary-indicator font-bold mt-0.5">•</span>
						<span><strong>@ symbol check:</strong> Email must include @ symbol</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-primary-indicator font-bold mt-0.5">•</span>
						<span><strong>Local and domain parts:</strong> Both local (before @) and domain (after @) must be present and non-empty</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-primary-indicator font-bold mt-0.5">•</span>
						<span><strong>Domain extension:</strong> Domain must contain a . (period)</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-primary-indicator font-bold mt-0.5">•</span>
						<span><strong>Custom validation:</strong> Optional customValidate prop for domain-specific rules</span>
					</li>
				</ul>
			</div>
{/snippet}

{#snippet member_invite_email_inputSection()}
			<p class="text-supporting mb-8">
				A membership invite email field that keeps EmailInput validation while exposing suggested members through a custom combobox list.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Suggested Members</h3>
					<MemberInviteEmailInput
						bind:value={inviteEmail}
						suggestions={memberSuggestions}
						label="Invite member"
						placeholder="Email address"
					/>
					<p class="text-xs text-muted mt-2">Value: <code>{inviteEmail || '(empty)'}</code></p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Arbitrary Email</h3>
					<MemberInviteEmailInput
						value="outside@example.com"
						suggestions={[]}
						label="Invite unsuggested account"
						placeholder="Email address"
					/>
					<p class="text-xs text-muted mt-2">Works without suggestions.</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{memberInviteEmailInputCode}</code></pre>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">value</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Bindable invite email value.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">suggestions</td>
								<td class="px-4 py-2 text-supporting">MemberSuggestionDto[]</td>
								<td class="px-4 py-2 text-supporting">[]</td>
								<td class="px-4 py-2 text-supporting">Suggested contacts rendered as custom combobox options.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Email'</td>
								<td class="px-4 py-2 text-supporting">Visible field label inherited from EmailInput.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'your@email.com'</td>
								<td class="px-4 py-2 text-supporting">Placeholder text inherited from EmailInput.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">required</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">true</td>
								<td class="px-4 py-2 text-supporting">Whether the invite email is required.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">customValidate</td>
								<td class="px-4 py-2 text-supporting">function | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Additional validator passed through to EmailInput.</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="text-sm text-supporting mt-4">
					Standard native input attributes and handlers supported by <code>EmailInput</code> are forwarded.
				</p>
			</div>
{/snippet}

{#snippet selectSection()}
			<p class="text-supporting mb-8">
				A reusable searchable single-select component with keyboard navigation, custom validation, predefined typed values, and accessibility support.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Basic Select</h3>
					<Select
						options={fruits}
						selected={selectedFruit}
						label="Choose a Fruit"
						placeholder="Pick one..."
						onSelect={(value) => {
							selectedFruit = value;
						}}
					/>
					<p class="text-xs text-muted mt-2">Selected: <code>{selectedFruit || '(none)'}</code></p>
				</div>

				<!-- Priority Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">With Validation</h3>
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
					<p class="text-xs text-muted mt-2">Selected: <code>{selectedPriority || '(none)'}</code></p>
				</div>

				<!-- Category Example with Callback -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">With Callback</h3>
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
					<p class="text-xs text-muted mt-2">Selected: <code>{selectedCategory || '(none)'}</code></p>
				</div>

				<!-- Disabled Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<Select
						options={fruits}
						selected="Apple"
						label="Read-only Select"
						disabled
					/>
				</div>

				<!-- Empty State Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Empty Options</h3>
					<Select
						options={[]}
						label="No Options"
						placeholder="Select an option..."
					/>
				</div>

				<!-- Minimal Example -->
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Minimal (No Label)</h3>
					<Select
						options={['Red', 'Green', 'Blue']}
						placeholder="Pick a color..."
					/>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-supporting mb-2">Basic select:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{basicSelectCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">With validation:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{selectWithValidationCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-supporting mb-2">With callback:</p>
						<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{selectWithCallbackCode}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">options</td>
								<td class="px-4 py-2 text-supporting">T[]</td>
								<td class="px-4 py-2 text-supporting">[]</td>
								<td class="px-4 py-2 text-supporting">Array of options to display</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">selected</td>
								<td class="px-4 py-2 text-supporting">T | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">The currently selected option</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">''</td>
								<td class="px-4 py-2 text-supporting">Label displayed above the dropdown</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Select an option'</td>
								<td class="px-4 py-2 text-supporting">Placeholder text when no option is selected</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">validate</td>
								<td class="px-4 py-2 text-supporting">function | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Optional validator: (value) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">onSelect</td>
								<td class="px-4 py-2 text-supporting">function | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Callback fired when an option is selected: (value) => void</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disable the dropdown</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Keyboard Shortcuts -->
			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Keyboard Shortcuts</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="font-mono text-sm text-primary mb-1">Type</p>
						<p class="text-sm text-supporting">Filter predefined options</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Enter, ↓</p>
						<p class="text-sm text-supporting">Open dropdown (when closed)</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">↑ ↓</p>
						<p class="text-sm text-supporting">Navigate between options</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Home, End</p>
						<p class="text-sm text-supporting">Jump to first/last option</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Enter</p>
						<p class="text-sm text-supporting">Select focused option</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Escape</p>
						<p class="text-sm text-supporting">Close dropdown</p>
					</div>
					<div>
						<p class="font-mono text-sm text-primary mb-1">Click outside</p>
						<p class="text-sm text-supporting">Close dropdown</p>
					</div>
				</div>
			</div>
{/snippet}

{#snippet multi_selectSection()}
			<p class="text-supporting mb-8">
				A reusable searchable multi-select component that extends the shared combobox
				interaction pattern while keeping the option list open for repeated selection.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Empty State</h3>
					<MultiSelect
						options={fruits}
						bind:selected={selectedFruits}
						label="Favorite fruits"
						placeholder="Choose fruits..."
					/>
					<p class="text-xs text-muted mt-2">
						Selected: <code>{selectedFruits.length ? selectedFruits.join(', ') : '(none)'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Multiple Selected Values</h3>
					<MultiSelect
						options={['Home', 'Work', 'Errands', 'Shopping']}
						selected={['Home', 'Shopping']}
						label="List groups"
						placeholder="Choose groups..."
					/>
				</div>

				<div class="md:col-span-2">
					<h3 class="text-lg font-semibold text-value mb-4">Custom Assignee Rendering</h3>
					<MultiSelect
						options={assigneeOptions}
						bind:selected={selectedAssignees}
						label="Assignees"
						placeholder="Choose assignees..."
						getOptionLabel={(assignee) => assignee.name}
						optionKey={(assignee) => assignee.id}
						onChange={handleAssigneeSelection}
					>
						{#snippet selectedContent(assignee)}
							<span class="inline-flex min-w-0 items-center gap-1.5">
								<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary-strong" aria-hidden="true">
									{assignee.name[0]}
								</span>
								<span class="truncate">{assignee.name}</span>
							</span>
						{/snippet}

						{#snippet optionContent(assignee)}
							<span class="inline-flex min-w-0 items-center gap-2">
								<span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary-strong" aria-hidden="true">
									{assignee.name[0]}
								</span>
								<span class="truncate">{assignee.name}</span>
							</span>
						{/snippet}
					</MultiSelect>
					<p class="text-xs text-muted mt-2">
						Selected IDs: <code>{latestAssigneeSelection}</code>
					</p>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{multiSelectCode}</code></pre>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr><td class="px-4 py-2 font-mono text-primary">options</td><td class="px-4 py-2 text-supporting">T[]</td><td class="px-4 py-2 text-supporting">[]</td><td class="px-4 py-2 text-supporting">Array of options to display.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">selected</td><td class="px-4 py-2 text-supporting">T[]</td><td class="px-4 py-2 text-supporting">[]</td><td class="px-4 py-2 text-supporting">Bindable selected option array.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">label</td><td class="px-4 py-2 text-supporting">string</td><td class="px-4 py-2 text-supporting">''</td><td class="px-4 py-2 text-supporting">Visible field label and accessible name.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">placeholder</td><td class="px-4 py-2 text-supporting">string</td><td class="px-4 py-2 text-supporting">'Select options'</td><td class="px-4 py-2 text-supporting">Empty-state trigger text.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">getOptionLabel</td><td class="px-4 py-2 text-supporting">(option: T) =&gt; string</td><td class="px-4 py-2 text-supporting">String(option)</td><td class="px-4 py-2 text-supporting">Accessible option label and filter text.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">optionKey</td><td class="px-4 py-2 text-supporting">(option: T, index: number) =&gt; string</td><td class="px-4 py-2 text-supporting">index</td><td class="px-4 py-2 text-supporting">Stable option identity for keyed rendering.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">selectedContent</td><td class="px-4 py-2 text-supporting">Snippet&lt;[T]&gt;</td><td class="px-4 py-2 text-supporting">undefined</td><td class="px-4 py-2 text-supporting">Custom selected-value content.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">optionContent</td><td class="px-4 py-2 text-supporting">Snippet&lt;[T]&gt;</td><td class="px-4 py-2 text-supporting">undefined</td><td class="px-4 py-2 text-supporting">Custom option content.</td></tr>
							<tr><td class="px-4 py-2 font-mono text-primary">onChange</td><td class="px-4 py-2 text-supporting">(values: T[]) =&gt; void</td><td class="px-4 py-2 text-supporting">undefined</td><td class="px-4 py-2 text-supporting">Receives the complete selected array after changes.</td></tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

{#snippet category_selectSection()}
			<p class="text-supporting mb-8">
				A category-specific Select adapter that preserves shared combobox behavior while
				displaying category colors, aligned colorless categories, and an uncategorized value.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Category Binding</h3>
					<CategorySelect
						categories={categorySelectCategories}
						bind:selectedCategoryId
						label="Showcase category"
					/>
					<p class="text-xs text-muted mt-2">
						Selected category ID: <code>{selectedCategoryId ?? 'null'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<CategorySelect
						categories={categorySelectCategories}
						selectedCategoryId="showcase-household"
						label="Locked category"
						disabled
					/>
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<p class="text-sm font-mono text-supporting mb-2">Nullable category identifier:</p>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{categorySelectCode}</code></pre>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">categories</td>
								<td class="px-4 py-2 text-supporting">Category[]</td>
								<td class="px-4 py-2 text-supporting">[]</td>
								<td class="px-4 py-2 text-supporting">Available categories with IDs, names, and optional colors.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">selectedCategoryId</td>
								<td class="px-4 py-2 text-supporting">string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Bindable selected category ID; null represents Uncategorized.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Category'</td>
								<td class="px-4 py-2 text-supporting">Visible Select label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Select a category'</td>
								<td class="px-4 py-2 text-supporting">Text shown when no category is selected.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disables the shared Select trigger.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">onSelect</td>
								<td class="px-4 py-2 text-supporting">(categoryId: string | null) =&gt; void</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">Receives the selected category ID or null for Uncategorized.</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="text-sm text-supporting mt-4">
					CategorySelect composes the shared Select behavior for filtering, keyboard navigation,
					focus handling, and listbox semantics.
				</p>
			</div>
{/snippet}

{#snippet timezone_pickerSection()}
			<p class="text-supporting mb-8">
				A timezone-specific Select that exposes exact IANA identifiers, displays friendly
				region labels, includes UTC, and falls back to the selected and browser-detected zones
				when full browser enumeration is unavailable.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<div>
					<h3 class="text-lg font-semibold text-value mb-4">IANA Timezone Binding</h3>
					<TimezonePicker bind:selected={selectedTimeZone} label="Account timezone" />
					<p class="text-xs text-muted mt-2">
						Selected identifier: <code>{selectedTimeZone ?? '(none)'}</code>
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-value mb-4">Disabled State</h3>
					<TimezonePicker selected="UTC" label="Locked timezone" disabled />
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Usage Example</h3>
				<p class="text-sm font-mono text-supporting mb-2">Bindable IANA identifier:</p>
				<pre class="bg-surface-inverse text-on-inverse p-4 rounded text-sm overflow-x-auto"><code>{timezonePickerCode}</code></pre>
			</div>

			<div class="mt-12 pt-8 border-t border-border">
				<h3 class="text-lg font-semibold text-value mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left px-4 py-2 font-semibold text-label">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-label">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-2 font-mono text-primary">selected</td>
								<td class="px-4 py-2 text-supporting">string | null</td>
								<td class="px-4 py-2 text-supporting">null</td>
								<td class="px-4 py-2 text-supporting">Bindable exact IANA timezone identifier.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">label</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Timezone'</td>
								<td class="px-4 py-2 text-supporting">Visible Select label.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">placeholder</td>
								<td class="px-4 py-2 text-supporting">string</td>
								<td class="px-4 py-2 text-supporting">'Select a timezone'</td>
								<td class="px-4 py-2 text-supporting">Text shown when no timezone is selected.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">disabled</td>
								<td class="px-4 py-2 text-supporting">boolean</td>
								<td class="px-4 py-2 text-supporting">false</td>
								<td class="px-4 py-2 text-supporting">Disables the shared Select trigger.</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-primary">onSelect</td>
								<td class="px-4 py-2 text-supporting">(value: string) =&gt; void</td>
								<td class="px-4 py-2 text-supporting">undefined</td>
								<td class="px-4 py-2 text-supporting">Receives the selected IANA identifier.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
{/snippet}

<div class="min-h-screen bg-canvas p-4 sm:p-8">
	<div class="max-w-7xl mx-auto">
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-heading mb-2">Component Library Showcase</h1>
			<p class="text-supporting">
				{#if dev}
					<span class="inline-flex items-center gap-2 bg-warning-surface border border-warning-soft px-3 py-1 rounded text-sm">
						<span class="w-2 h-2 bg-warning-indicator rounded-full"></span>
						Development mode — this route is hidden in production
					</span>
				{/if}
			</p>
		</div>

		<div class="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
			<nav aria-label="Component sections" class="sticky top-0 z-10 mb-6 self-start bg-canvas py-2 lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
				<ul class="flex gap-2 overflow-x-auto lg:flex-col">
					{#each sections as section (section.id)}
						<li class="shrink-0">
							<a href={'#' + section.id} class="flex min-h-11 items-center rounded px-3 py-2 text-sm font-medium text-label hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-primary focus-visible:ring-inset">{section.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
			<main class="min-w-0">
				{#each sections as section (section.id)}
					<section id={section.id} aria-labelledby={section.id + '-heading'} class="scroll-mt-20 bg-surface rounded-lg shadow-sm border border-border p-4 sm:p-8 mb-8 lg:scroll-mt-4">
						<h2 id={section.id + '-heading'} class="text-2xl font-bold text-heading mb-8">{section.title}</h2>
						{@render section.content()}
					</section>
				{/each}
			</main>
		</div>

		<!-- Future Components Notice -->
		<div class="bg-primary-surface border border-primary-soft rounded-lg p-6">
			<h3 class="font-semibold text-primary-heading mb-2">Coming Soon</h3>
			<p class="text-primary-emphasis text-sm">
				ItemCard and other components will be added to this showcase as they are implemented.
			</p>
		</div>
	</div>
</div>
