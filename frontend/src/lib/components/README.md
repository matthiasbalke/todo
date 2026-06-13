# Frontend Components

A small, reusable component library for SvelteKit UI primitives. Components follow these principles:

- **Simple and focused**: each component has a single responsibility
- **Accessible**: ARIA attributes, keyboard navigation, semantic HTML
- **Composable**: base components can be extended or combined for specialized behavior
- **Styled consistently**: shared controls own Tailwind utilities and any required dynamic styles
- **Testable**: each component includes comprehensive unit tests

## Base Components

### Toggle

Toggle is a native button switch for persistent boolean settings. It owns the rounded track,
movable thumb, on/off colors, transition, keyboard-visible focus ring, and disabled presentation.

- `checked` (boolean, bindable, default: `false`): current switch state
- `disabled` (boolean, default: `false`): prevent pointer and keyboard activation
- `ariaLabel` (string, optional): accessible name when `aria-labelledby` is not supplied
- `onchange` (`(checked: boolean) => void`, optional): receives the updated value
- `id` (string, optional): native button ID
- `class` (string, optional): parent-layout utilities only
- `element` (`HTMLButtonElement | null`, bindable): native element access
- Other native button attributes and handlers are forwarded.

Consumers must provide an accessible name with `ariaLabel` or `aria-labelledby`. Use Toggle for
persistent settings such as notification or view preferences; keep action buttons and
domain-specific completion/star controls on their dedicated components.

```svelte
<script lang="ts">
  import Toggle from '$lib/components/Toggle.svelte';

  let enabled = false;
</script>

<div class="flex items-center justify-between">
  <span id="notifications-label">Notifications</span>
  <Toggle
    bind:checked={enabled}
    aria-labelledby="notifications-label"
    onchange={(checked) => console.log(checked)}
  />
</div>

<Toggle checked disabled ariaLabel="Locked setting" />
```

### Button

A native button wrapper with semantic tone and appearance, consistent focus treatment, disabled behavior, and loading feedback.

#### Props

- `tone` (`'primary' | 'neutral' | 'danger' | 'success'`, default: `'primary'`): semantic intent
- `appearance` (`'solid' | 'outline' | 'soft' | 'ghost' | 'bare'`, default: `'solid'`): visual treatment
- `size`: named action, field, menu, option, chip, row, title, and backdrop geometry
- `align` (`'center' | 'start' | 'between'`, default: `'center'`): horizontal flex alignment for button content
- `weight` (`'normal' | 'medium' | 'bold'`, default: `'medium'`): button font weight
- `emphasis` (`'default' | 'muted' | 'subtle'`, default: `'default'`): neutral-action emphasis
- `selected`, `active`, and `invalid` (boolean): shared interaction-state presentation
- `type` (`'button' | 'submit' | 'reset'`, default: `'button'`): native button type
- `disabled` (boolean, default: false): disable activation
- `loading` (boolean, default: false): disable activation, set `aria-busy`, and show loading text
- `loadingLabel` (string, default: `'Loading…'`): text displayed while loading
- `class` (string, optional): parent-layout utilities only
- `children` (snippet): text, icons, or combined button content
- All other standard button attributes and native event handlers are forwarded.

#### Usage

```svelte
<script lang="ts">
  import Button from '$lib/components/Button.svelte';

  let saving = false;
</script>

<Button onclick={() => console.log('Saved')}>Save</Button>
<Button tone="neutral" appearance="outline">Cancel</Button>
<Button tone="danger" appearance="solid">Delete</Button>
<Button tone="neutral" appearance="ghost" size="icon" aria-label="Open menu">⋮</Button>
<Button tone="neutral" appearance="bare" size="menu" align="start" weight="normal">Menu item</Button>
<Button tone="neutral" appearance="bare" size="menu" align="between" weight="normal" selected>
  <span>Filter</span><span>Off</span>
</Button>
<Button type="submit" loading={saving} loadingLabel="Saving…" class="w-full">
  Submit
</Button>
```

#### Styling

- Tone owns semantic color; appearance independently selects solid, outline, soft, ghost, or bare treatment.
- All presentations share focus, disabled, loading, alignment, and event behavior.
- Use `align="start"` for full-width rows with one leading label and `align="between"` when trailing status or disclosure content must remain at the opposite edge.
- Use named menu sizes and `selected` for menu options instead of supplying padding, typography, hover, or color utilities.
- Consumer classes are limited to parent layout such as `w-full`, margin, positioning, and flex participation.

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

### Select

Select renders a semantic Button trigger and listbox options with unique IDs, keyboard navigation, validation, and typed option values.

The trigger and listbox share a trigger-local positioning wrapper. An open listbox is placed directly below the trigger at the same width, including inside transformed dialogs such as MembersDialog. Consumers must not provide positioning offsets or listbox visual styles.

Select currently does not perform viewport collision detection, upward opening, or edge shifting. Those behaviors require a separate popover positioning capability if a future overflow-constrained consumer needs them.

### TimezonePicker

TimezonePicker composes `Select` for IANA timezone selection. It always includes `UTC`, uses
`Intl.supportedValuesOf('timeZone')` when available, and retains valid selected and
browser-detected values when full enumeration is unavailable.

- `selected` (`string | null`, bindable, default: `null`): exact IANA identifier
- `label` (string, default: `'Timezone'`): visible Select label
- `placeholder` (string, default: `'Select a timezone'`): null-selection text
- `disabled` (boolean, default: false): disable selection
- `onSelect` (`(value: string) => void`, optional): receives the exact selected identifier

```svelte
<TimezonePicker bind:selected={timeZone} label="Account timezone" />
```

Visible labels are derived from identifiers, such as `Berlin (Europe)`, while bound and callback
values remain unchanged, such as `Europe/Berlin`.

## Specialized Interaction Controls

These controls expose domain state rather than consumer-owned visual CSS:

- `CalendarDayButton`: `value`, `day`, `label`, `selected`, `current`, `adjacent`, `disabled`, and `focused`; owns `gridcell` semantics, roving tabindex, date-state presentation, native events, and element binding.
- `ColorSwatchButton`: `color`, `selected`, `label`, `disabled`, and `onselect`; applies arbitrary category color data internally and exposes selection through `aria-pressed`.
- `CompletionToggle`: `done`, `disabled`, and `onactivate`; owns circular checked presentation, action labeling, `aria-pressed`, and capture-phase touch handling.
- `StarToggle`: `starred`, `disabled`, and `onactivate`; owns active/inactive star presentation, action labeling, `aria-pressed`, and capture-phase touch handling.
- `SwipeDeleteAction`: `label`, `width`, `fillHeight`, `disabled`, and `onactivate`; composes `Button` with destructive semantics and exposes only the geometry needed by swipe orchestration.

Calendar, swatch, completion, and star controls use native buttons internally because their geometry and state visuals are domain-specific and would expand the generic Button API. Consumers must not pass visual classes or inline styles to specialized controls. Parent components retain date calculations, persistence, store mutations, and gesture orchestration.

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
- `size` (`'default' | 'small' | 'compact' | 'title'`): named control geometry
- `appearance` (`'default' | 'inline'`): bordered field or inline title editing
- `class` and `containerClass` (string, optional): parent-layout hooks
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
- `id`, `displayAppearance`, `inputSize`, `containerClass`, and `element`: ID, named presentation, layout, and focus hooks

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
2. **Compose over copy-paste**: composite controls reuse lower-level primitives such as Button and TextInput.
3. **Keep validators simple**: move complex validation to the parent form if needed.
4. **Keep styling semantic**: use typed tone, appearance, size, emphasis, and state props; consumer classes are for parent layout only.
5. **Test as you build**: write tests for any new component or specialized variant.

## Native Control Migration

Production consumers must use `Button`, `TextInput`, `EmailInput`, `Select`, `Textarea`, `DatePicker`, `EditableLabel`, or a matching specialized interaction control when one exists. Native implementations remain allowed inside shared primitives and in the development showcase. Run `bun run test --run src/lib/components/nativeControlInventory.test.ts` to check the boundary; any exception must include a source path, line, element, and reason.

The semantic styling guard additionally rejects visual utility overrides and removed visual class props on shared-control consumers. The specialized exception inventory is empty; calendar-day, color-swatch, completion, star, and swipe-delete visuals must use their dedicated controls.
