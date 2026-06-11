# Frontend Components

A small, reusable component library for SvelteKit UI primitives. Components follow these principles:

- **Simple and focused**: each component has a single responsibility
- **Accessible**: ARIA attributes, keyboard navigation, semantic HTML
- **Composable**: base components can be extended or combined for specialized behavior
- **Styled consistently**: Tailwind utilities + scoped component styles; no inline CSS
- **Testable**: each component includes comprehensive unit tests

## Base Components

### Button

A native button wrapper with consistent variants, focus treatment, disabled behavior, and loading feedback.

#### Props

- `variant` (`'primary' | 'secondary' | 'danger' | 'ghost' | 'bare'`, default: `'primary'`): visual intent
- `size` (`'default' | 'small' | 'compact' | 'icon' | 'menu' | 'chip' | 'backdrop'`, default: `'default'`): control geometry
- `align` (`'center' | 'start' | 'between'`, default: `'center'`): horizontal flex alignment for button content
- `weight` (`'normal' | 'medium'`, default: `'medium'`): button font weight
- `type` (`'button' | 'submit' | 'reset'`, default: `'button'`): native button type
- `disabled` (boolean, default: false): disable activation
- `loading` (boolean, default: false): disable activation, set `aria-busy`, and show loading text
- `loadingLabel` (string, default: `'Loading…'`): text displayed while loading
- `class` (string, optional): additional classes merged with the component styles
- `children` (snippet): text, icons, or combined button content
- All other standard button attributes and native event handlers are forwarded.

#### Usage

```svelte
<script lang="ts">
  import Button from '$lib/components/Button.svelte';

  let saving = false;
</script>

<Button onclick={() => console.log('Saved')}>Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost" size="icon" aria-label="Open menu">⋮</Button>
<Button variant="bare" align="start" weight="normal" class="w-full">Menu item</Button>
<Button variant="bare" align="between" weight="normal" class="w-full text-blue-600">
  <span>Filter</span><span>Off</span>
</Button>
<Button type="submit" loading={saving} loadingLabel="Saving…" class="w-full">
  Submit
</Button>
```

#### Styling

- Primary: blue background with white text
- Secondary: white background with neutral border and text
- Danger: red background with white text
- All variants share rounded corners, focus rings, transitions, and disabled opacity
- Use `align="start"` for full-width rows with one leading label and `align="between"` when trailing status or disclosure content must remain at the opposite edge.
- Use `weight="normal"` for menu actions and options. Selected options remain regular weight and use blue text plus their selection indicator; unselected options use neutral text.

### DatePicker

A custom single-date calendar popover for nullable ISO calendar dates.

#### Props

- `value` (`string | null`, bindable, default: `null`): selected `YYYY-MM-DD` date
- `label` (string, default: `''`): visible trigger label
- `placeholder` (string, default: `'Select a date'`): text shown when value is null
- `required` (boolean, default: false): show the required marker
- `disabled` (boolean, default: false): disable the trigger and calendar
- `min` (`string | null`, default: `null`): inclusive minimum ISO date
- `max` (`string | null`, default: `null`): inclusive maximum ISO date
- `locale` (string, optional): locale used by `Intl.DateTimeFormat`
- `ariaLabel` (string, optional): accessible trigger label override

#### Usage

```svelte
<script lang="ts">
  import DatePicker from '$lib/components/DatePicker.svelte';

  let dueDate: string | null = null;
</script>

<DatePicker
  bind:value={dueDate}
  label="Due date"
  placeholder="No due date"
/>

<DatePicker
  bind:value={dueDate}
  label="Appointment"
  min="2026-06-01"
  max="2026-06-30"
  locale="en-US"
  required
/>
```

#### Value and Actions

- Values are date-only ISO strings (`YYYY-MM-DD`) or `null`; no UTC conversion is applied.
- **Today** selects the local calendar date when it is within min/max constraints.
- **Clear** sets the value to `null`.
- The calendar starts weeks on Monday and displays six stable rows.

#### Keyboard Controls

- **Arrow Left/Right**: previous/next day
- **Arrow Up/Down**: previous/next week
- **Home/End**: Monday/Sunday of the current week
- **Page Up/Page Down**: previous/next month
- **Enter/Space**: select focused date
- **Escape**: close without changing the value

### TextInput

A text input field with custom validation support, error display, and accessibility features.

#### Props

- `value` (string, bindable): the input value
- `label` (string): label text displayed above the input
- `placeholder` (string): placeholder text
- `type` (string, default: 'text'): HTML input type (text, email, password, search, etc.)
- `disabled` (boolean, default: false): disable the input
- `required` (boolean, default: false): mark the input as required
- `validate` (function, optional): custom validator function that takes a string and returns an error message (string) or null
- `ariaLabel` (string, optional): accessible label for screen readers
- `id` (string, optional): explicit input ID; otherwise a unique ID is generated
- `description` (string, optional): supporting text included in `aria-describedby`
- `element` (`HTMLInputElement | null`, bindable): native input access for focus management
- `class`, `containerClass`, `labelClass` (string, optional): styling hooks
- Standard text-input attributes and native event handlers are forwarded.

Use `oninput`, `onblur`, and `onfocus` native handler props. `EmailInput` forwards the same surface and adds email validation through `customValidate`.

#### Usage

```svelte
<script>
  import TextInput from '$lib/components/TextInput.svelte';

  let email = '';
  let password = '';

  function validateEmail(value) {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Email must be valid';
    return null;
  }

  function validatePassword(value) {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }
</script>

<TextInput
  bind:value={email}
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  validate={validateEmail}
  required
/>

<TextInput
  bind:value={password}
  label="Password"
  type="password"
  validate={validatePassword}
  required
/>
```

#### Styling

- Error state: red border, light red background, red ring on focus
- Normal state: gray border, white background, blue ring on focus
- Disabled state: gray background, gray text, gray border

### Textarea

A native multiline text field with bindable values, accessible supporting text, validation, and configurable sizing.

#### Props

- `value` (string, bindable, default: `''`): textarea value
- `label` (string, default: `''`): visible label associated with the textarea
- `description` (string, default: `''`): supporting text associated through `aria-describedby`
- `placeholder` (string, default: `''`): placeholder text
- `required` (boolean, default: false): set native required state and show the required marker
- `disabled` (boolean, default: false): disable editing
- `rows` (number, default: `3`): native textarea row count
- `resize` (`'none' | 'vertical' | 'horizontal' | 'both'`, default: `'vertical'`): resize behavior
- `validate` (function, optional): synchronous validator returning an error message or `null`
- `ariaLabel` (string, optional): accessible name for label-less usage
- `class` (string, optional): additional classes merged with component styles
- Standard textarea attributes and native event handlers are forwarded.

#### Usage

```svelte
<script lang="ts">
  import Textarea from '$lib/components/Textarea.svelte';

  let notes = '';

  function validateNotes(value: string) {
    if (value.length > 500) return 'Notes must be 500 characters or fewer';
    return null;
  }
</script>

<Textarea
  bind:value={notes}
  label="Notes"
  description="Add context that will help complete the item."
  placeholder="Enter notes"
  rows={4}
  resize="vertical"
  maxlength={500}
  validate={validateNotes}
/>
```

#### Validation and Accessibility

- Validation runs on input and blur.
- Errors set `aria-invalid`, use error styling, and are included in `aria-describedby`.
- Description, error, and consumer-provided description IDs are combined.
- Every component instance generates unique textarea and supporting-content IDs.

### EditableLabel

An inline editable field that displays as read-only text (label) and transforms into a text input when clicked. Ideal for user profile fields like display name or email where users need to edit values without navigating to a separate form.

#### Props

- `value` (string): the current value
- `label` (string): label text displayed above the input in edit mode
- `placeholder` (string): placeholder text for empty display or input
- `type` (string, default: 'text'): HTML input type (text, email, password, etc.)
- `disabled` (boolean, default: false): disable editing
- `required` (boolean, default: false): mark the input as required
- `validate` (function, optional): custom validator function that takes a string and returns an error message (string) or null
- `isSaving` (boolean, default: false): disable input during save operations (e.g., API calls)
- `ariaLabel` (string, optional): accessible label for screen readers
- `saveMode` (`'automatic' | 'explicit'`, default: `'automatic'`): save on Enter/blur or require the Save button
- `showCancel` (boolean, default: false): show an explicit Cancel button in explicit mode
- `oncancel` (function, optional): notified when an edit is discarded
- `id`, `displayClass`, `inputClass`, `containerClass`, and `element`: ID, styling, and focus hooks

#### Events

- `on:change`: fired when the value is saved; emits `{ detail: { value: string } }`

#### Interaction Modes

- **Automatic**: Enter and blur save; Escape cancels.
- **Explicit**: only the Save button commits; Enter leaves the editor open, blur discards the draft, and Escape cancels.
- **Display state**: click, Enter, or Space enters edit mode.

#### Usage

```svelte
<script>
  import EditableLabel from '$lib/components/EditableLabel.svelte';
  import { updateCurrentUser } from '$lib/stores/auth.svelte';

  let displayName = 'John Doe';
  let isSaving = false;

  function validateDisplayName(value) {
    if (!value.trim()) return 'Display name is required';
    if (value.length < 2) return 'Display name must be at least 2 characters';
    return null;
  }

  async function handleChange(e) {
    const { value } = e.detail;
    isSaving = true;
    try {
      await updateMe({ displayName: value });
      updateCurrentUser({ displayName: value });
    } catch (err) {
      displayName = displayName; // revert on error
    } finally {
      isSaving = false;
    }
  }
</script>

<!-- Display mode (reads as a label) -->
<EditableLabel
  bind:value={displayName}
  label="Display Name"
  placeholder="Click to edit"
  validate={validateDisplayName}
  {isSaving}
  on:change={handleChange}
/>

<!-- Require explicit confirmation -->
<EditableLabel
  bind:value={displayName}
  label="Display Name"
  saveMode="explicit"
  on:change={handleChange}
/>
```

#### Styling

- Display mode: gray text on white background with border; hover shows light gray background and darker border; disabled state shows opacity
- Edit mode: inherits TextInput styling (blue border, blue ring on focus, red border + error text on validation failure)
- Error state: red border, light red background, red ring on focus with error message below

## Component Extension Pattern

To create a specialized component based on a base component:

```svelte
<!-- PriceInput.svelte: extends TextInput for currency input -->
<script>
  import TextInput from './TextInput.svelte';

  export let value = '';
  
  function validatePrice(val) {
    if (!val) return 'Price is required';
    const num = parseFloat(val);
    if (isNaN(num)) return 'Price must be a number';
    return null;
  }
</script>

<TextInput {value} type="number" step="0.01" validate={validatePrice} ... />
```

## Testing Components

Components are tested with Vitest + @testing-library/svelte. Test files are colocated with components.

Run tests:

```bash
cd frontend && bun run test --run
```

Test coverage includes:
- Rendering (elements, attributes, conditional rendering)
- User interactions (input, blur, focus)
- Validation and error states
- Accessibility attributes (aria-*, role, label associations)
- Styling
- Edge cases (special characters, very long values, etc.)

## Guidelines

1. **Reuse components** when building forms or UI areas. Check if a base component exists before creating a new element.
2. **Compose over copy-paste**: if you need a variant of an existing component, extend it rather than duplicating code.
3. **Keep validators simple**: move complex validation to the parent form if needed.
4. **Use Tailwind for styling**: prefer utility classes over inline styles.
5. **Test as you build**: write tests for any new component or specialized variant.

## Native Control Migration

Production consumers must use `Button`, `TextInput`, `EmailInput`, `Select`, `Textarea`, `DatePicker`, or `EditableLabel` when a matching primitive exists. Native implementations remain allowed inside those primitives and in the development showcase. Run `bun run test --run src/lib/components/nativeControlInventory.test.ts` to check the boundary; any exception must include a source path, line, element, and reason.
